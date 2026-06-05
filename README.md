# Transaction Processor CDK

A complete transaction processing system built with AWS CDK, featuring real-time fraud detection using SQS, SNS, DynamoDB, and Lambda functions.

## Architecture

This solution implements the following architecture:

1. **API Gateway** → Exposes `POST /transactions` endpoint
2. **Transaction Lambda** → Receives transaction requests, saves to DynamoDB, sends to SQS queue
3. **Processing Queue** → SQS queue for pending transactions
4. **Anti-Fraud Lambda** → Consumes messages from processing queue, validates amounts (threshold: $2,500)
5. **Result Topic** → SNS topic for publishing fraud detection results
6. **Result Queue** → SQS queue subscribed to result topic
7. **Transaction Result Handler Lambda** → Updates DynamoDB with final status
8. **DynamoDB Table** → Stores transaction records with status tracking

## Folder Structure

```
.
├── bin/
│   └── transaction-processor.ts      # CDK app entry point
├── lib/
│   └── transaction-processor-stack.ts  # Stack definition
├── lambda/
│   ├── transaction/
│   │   └── index.ts                 # Transaction API handler
│   ├── anti-fraud/
│   │   └── index.ts                 # Fraud detection handler
│   └── transaction-result-handler/
│       └── index.ts                 # Result processing handler
├── package.json
├── tsconfig.json
├── cdk.json
└── README.md
```

## Prerequisites

- Node.js 20.x or higher
- AWS CDK CLI installed: `npm install -g aws-cdk`
- Floci

## Installation and Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Build the project:**
   ```bash
   npm run build
   ```

3. **Synthesize CloudFormation template:**
   ```bash
   npm run synth
   ```


## Local Deployment with Floci (LocalStack)

For development and testing, you can deploy to Floci running in Docker.

### Prerequisites

1. **Floci/LocalStack running in Docker:**
   ```bash
   docker run -d --name floci -p 4566:4566 -v /var/run/docker.sock:/var/run/docker.sock floci/floci:latest
   ```

2. **AWS CLI installed** (https://aws.amazon.com/cli/)

### Linux/Mac - Manual Commands

Set environment variables:
```bash
export AWS_ENDPOINT_URL=http://localhost:4566
export AWS_ACCESS_KEY_ID=test
export AWS_SECRET_ACCESS_KEY=test
export AWS_REGION=us-east-1
```

Then deploy:
```bash
npm run build
make deploy
```

Monitor resources:
```bash
aws sqs list-queues --endpoint-url=http://localhost:4566
aws sqs get-queue-attributes --queue-url http://localhost:4566/000000000000/transaction-processing-queue --attribute-names All --endpoint-url http://localhost:4566
aws dynamodb list-tables --endpoint-url=http://localhost:4566
aws dynamodb describe-table --table-name payments-stack-TransactionsTable0A011FCB-f744dff28af3 --endpoint-url http://localhost:4566
aws dynamodb scan --table-name TransactionsTable --endpoint-url=http://localhost:4566
```
aws apigateway get-resources --rest-api-id f2e9eb0c5b --endpoint-url=http://localhost:4566
aws apigateway get-stages --rest-api-id f2e9eb0c5b --endpoint-url=http://localhost:4566
aws dynamodb list-tables --endpoint-url http://localhost:4566
Test the API:
```bash
curl -X POST http://localhost:4566/restapis/[API_ID]/prod/transactions \
  -H "Content-Type: application/json" \
  -d '{"amount": 1500}'
```

## Usage

### Create a Transaction

Send a POST request to the API endpoint with a transaction amount:

```bash
curl -X POST https://<api-id>.execute-api.<region>.amazonaws.com/prod/transactions \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 1500
  }'
```

Response example:
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "status": "pending",
  "amount": 1500
}
```

### Transaction Processing Flow

1. **Transaction Creation** (0-1 seconds)
   - Transaction saved to DynamoDB with `pending` status
   - Message sent to processing queue

2. **Fraud Detection** (1-5 seconds)
   - Anti-fraud Lambda consumes message from processing queue
   - Validates amount against $2,500 threshold
   - Publishes result to SNS topic

3. **Result Processing** (5-10 seconds)
   - Transaction Result Handler consumes result from queue
   - Updates DynamoDB with final status (`completed` or `rejected`)
   - Adds reason for rejection if applicable

### Amount Thresholds

- **Amount ≤ $2,500**: Status = `completed` ✅
- **Amount > $2,500**: Status = `rejected` ❌

## Scripts

- `npm run build` - Compile TypeScript
- `npm run watch` - Watch mode for development
- `npm run test` - Run tests (if configured)
- `npm run synth` - Generate CloudFormation template
- `npm run lint` - Lint code with ESLint
- `npm run format` - Format code with Prettier

## Cleanup

To remove all AWS resources:

```bash
npm run destroy
```

## Key Technologies

- **AWS CDK** - Infrastructure as Code
- **TypeScript** - Strong typing and better development experience
- **AWS SDK v3** - Latest AWS SDK
- **ESLint & Prettier** - Code quality and formatting

## Security Notes

- DynamoDB uses `PAY_PER_REQUEST` billing (auto-scaling)
- Lambdas have minimal IAM permissions (principle of least privilege)
- API Gateway has CORS enabled for all origins (adjust as needed for production)
- All queues are encrypted by default

## Additional AWS CDK Resources

- [AWS CDK Documentation](https://docs.aws.amazon.com/cdk/)
- [AWS Lambda Best Practices](https://docs.aws.amazon.com/lambda/)
- [AWS CDK Examples](https://github.com/aws-samples/aws-cdk-examples)

## License

MIT-0 (See LICENSE file if applicable)