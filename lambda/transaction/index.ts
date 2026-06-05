import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand } from '@aws-sdk/lib-dynamodb';
import { SQSClient, SendMessageCommand } from '@aws-sdk/client-sqs';

const ddbClient = new DynamoDBClient({ region: 'us-west-2' });
const ddbDocClient = DynamoDBDocumentClient.from(ddbClient);
const sqsClient = new SQSClient({ region: 'us-west-2' });

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    console.log('Received request:', event.body);

    const { amount, transactionId } = JSON.parse(event.body as any);

    if (typeof amount !== 'number' || amount <= 0) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          error: 'Invalid amount. Must be a positive number.',
        }),
      };
    }

    const timestamp = new Date().toISOString();

    console.log(`Save transaction ${transactionId} on DynamoDB table ${process.env.TABLE_NAME}`);
    await ddbDocClient.send(
      new PutCommand({
        TableName: process.env.TABLE_NAME,
        Item: {
          id: transactionId,
          amount,
          status: 'pending',
          createdAt: timestamp,
        },
      }),
    );

    console.log(`Sending message to SQS for transaction processing`);
    await sqsClient.send(
      new SendMessageCommand({
        QueueUrl: 'http://localhost:4566/000000000000/transaction-processing-queue',
        MessageBody: JSON.stringify({
          id: transactionId,
          amount,
          timestamp,
        }),
      }),
    );

    console.log(`Transaction ${transactionId} created with amount ${amount}`);

    return {
      statusCode: 200,
      body: JSON.stringify({
        id: transactionId,
        status: 'pending',
        amount,
      }),
      headers: {
        'Content-Type': 'application/json',
      },
    };
  } catch (error) {
    console.error('Error processing transaction:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: 'Internal server error',
      }),
      headers: {
        'Content-Type': 'application/json',
      },
    };
  }
};
