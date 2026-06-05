import { SQSEvent, SQSHandler } from 'aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, UpdateCommand } from '@aws-sdk/lib-dynamodb';

const ddbClient = new DynamoDBClient({ region: process.env.AWS_REGION });
const ddbDocClient = DynamoDBDocumentClient.from(ddbClient);

const TABLE_NAME = process.env.TABLE_NAME || '';

export const handler: SQSHandler = async (event: SQSEvent) => {
  console.log('Processing transaction results');
  console.log('Event:', JSON.stringify(event, null, 2));

  const records = event.Records || [];

  for (const record of records) {
    try {
      // Extract the message from SNS subscription
      const snsMessage = JSON.parse(record.body);
      const message = JSON.parse(snsMessage.Message);
      const { id, status, reason } = message;

      console.log(`Updating transaction ${id} with status: ${status}`);

      // Update transaction status in DynamoDB
      await ddbDocClient.send(
        new UpdateCommand({
          TableName: TABLE_NAME,
          Key: { id },
          UpdateExpression: 'SET #status = :status, #reason = :reason, #updatedAt = :updatedAt',
          ExpressionAttributeNames: {
            '#status': 'status',
            '#reason': 'reason',
            '#updatedAt': 'updatedAt',
          },
          ExpressionAttributeValues: {
            ':status': status,
            ':reason': reason,
            ':updatedAt': new Date().toISOString(),
          },
        }),
      );

      console.log(
        `Transaction ${id} updated successfully with status: ${status}`,
      );
    } catch (error) {
      console.error('Error updating transaction:', error);
      throw error;
    }
  }
};
