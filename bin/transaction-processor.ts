#!/usr/bin/env node
import 'source-map-support/register';
import { Environment, App, StackProps } from 'aws-cdk-lib';
import { TransactionProcessorStack } from '../lib/transaction-processor-stack';

const app = new App();

const stackEnv: Environment = {
  account: '000000000000',
  region: 'us-east-1',
};

new TransactionProcessorStack(app, 'TransactionProcessorStack', {
  description: 'Transaction Processor Stack with SQS, SNS, DynamoDB and Lambda',
  env: stackEnv,
} as StackProps);

app.synth();
