import { z } from 'zod';

const EnvSchema = z.object({
  AWS_REGION: z.string(),
  TABLE_NAME: z.string(),
  PROCESSING_QUEUE_URL: z.string(),
  RESULT_TOPIC_ARN: z.string(),
});

export const config = EnvSchema.parse(process.env);