import { SQSEvent, SQSHandler } from 'aws-lambda';
import { SNSClient, PublishCommand } from '@aws-sdk/client-sns';

const snsClient = new SNSClient({ region: process.env.AWS_REGION });
const RESULT_TOPIC_ARN = process.env.RESULT_TOPIC_ARN || '';

const FRAUD_THRESHOLD = 2500;

export const handler: SQSHandler = async (event: SQSEvent) => {
  console.log('Processing anti-fraud checks for transactions');
  console.log('Event:', JSON.stringify(event, null, 2));

  const messages = event.Records || [];

  for (const record of messages) {
    try {
      const message = JSON.parse(record.body);
      const { id, amount } = message;

      console.log(`Processing transaction ${id} with amount ${amount}`);

      // Fraud detection: check if amount exceeds threshold
      const status = amount > FRAUD_THRESHOLD ? 'rejected' : 'completed';
      const reason =
        status === 'rejected'
          ? `Amount exceeds fraud threshold of ${FRAUD_THRESHOLD}`
          : 'Transaction validated successfully';

      // Publish result to SNS topic
      const resultMessage = {
        id,
        amount,
        status,
        reason,
        processedAt: new Date().toISOString(),
      };

      await snsClient.send(
        new PublishCommand({
          TopicArn: RESULT_TOPIC_ARN,
          Message: JSON.stringify(resultMessage),
          Subject: `Transaction ${id} - ${status.toUpperCase()}`,
        }),
      );

      console.log(
        `Transaction ${id} published with status: ${status}`,
      );
    } catch (error) {
      console.error('Error processing message:', error);
      throw error;
    }
  }
};
