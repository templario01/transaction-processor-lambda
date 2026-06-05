import * as cdk from 'aws-cdk-lib';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as sqs from 'aws-cdk-lib/aws-sqs';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as subscriptions from 'aws-cdk-lib/aws-sns-subscriptions';
import * as lambdaNodejs from 'aws-cdk-lib/aws-lambda-nodejs';
import * as lambdaEventSources from 'aws-cdk-lib/aws-lambda-event-sources';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as path from 'path';
import { Construct } from 'constructs';

export class TransactionProcessorStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // DynamoDB Table for transactions
    const transactionsTable = new dynamodb.Table(this, 'TransactionsTable', {
      partitionKey: { name: 'id', type: dynamodb.AttributeType.STRING },
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
    });

    // SQS Queue for processing transactions
    const processingQueue = new sqs.Queue(this, 'ProcessingQueue', {
      queueName: 'transaction-processing-queue',
      visibilityTimeout: cdk.Duration.seconds(300),
    });

    // SQS Queue for results
    const resultQueue = new sqs.Queue(this, 'ResultQueue', {
      queueName: 'transaction-result-queue',
      visibilityTimeout: cdk.Duration.seconds(300),
    });

    // SNS Topic for publishing fraud detection results
    const resultTopic = new sns.Topic(this, 'ResultTopic', {
      topicName: 'transaction-result-topic',
    });

    // Subscribe result queue to result topic
    resultTopic.addSubscription(
      new subscriptions.SqsSubscription(resultQueue),
    );

    // Transaction API Lambda (handler for POST /transactions)
    const transactionLambda = new lambdaNodejs.NodejsFunction(
      this,
      'TransactionLambda',
      {
        runtime: cdk.aws_lambda.Runtime.NODEJS_20_X,
        handler: 'handler',
        entry: path.join(__dirname, '../lambda/transaction/index.js'),
        environment: {
          TABLE_NAME: transactionsTable.tableName,
          PROCESSING_QUEUE_URL: processingQueue.queueUrl,
        },
      },
    );

    // Anti-fraud Lambda (processes messages from processing queue)
    const antiFraudLambda = new lambdaNodejs.NodejsFunction(
      this,
      'AntiFraudLambda',
      {
        runtime: cdk.aws_lambda.Runtime.NODEJS_20_X,
        handler: 'handler',
        entry: path.join(__dirname, '../lambda/anti-fraud/index.js'),
        environment: {
          RESULT_TOPIC_ARN: resultTopic.topicArn,
        },
      },
    );

    // Transaction Result Handler Lambda (processes messages from result queue)
    const transactionResultHandlerLambda = new lambdaNodejs.NodejsFunction(
      this,
      'TransactionResultHandlerLambda',
      {
        runtime: cdk.aws_lambda.Runtime.NODEJS_20_X,
        handler: 'handler',
        entry: path.join(
          __dirname,
          '../lambda/transaction-result-handler/index.js',
        ),
        environment: {
          TABLE_NAME: transactionsTable.tableName,
        },
      },
    );

    // Grant permissions
    transactionsTable.grantReadWriteData(transactionLambda);
    transactionsTable.grantReadWriteData(transactionResultHandlerLambda);

    processingQueue.grantSendMessages(transactionLambda);
    processingQueue.grantConsumeMessages(antiFraudLambda);

    resultQueue.grantConsumeMessages(transactionResultHandlerLambda);
    resultTopic.grantPublish(antiFraudLambda);

    // Event sources
    antiFraudLambda.addEventSource(
      new lambdaEventSources.SqsEventSource(processingQueue, {
        batchSize: 10,
      }),
    );

    transactionResultHandlerLambda.addEventSource(
      new lambdaEventSources.SqsEventSource(resultQueue, {
        batchSize: 10,
      }),
    );

    // API Gateway
    const api = new apigateway.RestApi(this, 'TransactionApi', {
      restApiName: 'Transaction Service API',
      description: 'API for processing transactions',
      defaultCorsPreflightOptions: {
        allowOrigins: apigateway.Cors.ALL_ORIGINS,
        allowMethods: apigateway.Cors.ALL_METHODS,
      },
    });

    const transactionsResource = api.root.addResource('transactions');
    transactionsResource.addMethod(
      'POST',
      new apigateway.LambdaIntegration(transactionLambda),
    );

    // Outputs
    new cdk.CfnOutput(this, 'ApiUrl', {
      value: api.url,
      description: 'API Gateway endpoint URL',
    });

    new cdk.CfnOutput(this, 'ProcessingQueueUrl', {
      value: processingQueue.queueUrl,
      description: 'Processing Queue URL',
    });

    new cdk.CfnOutput(this, 'ResultQueueUrl', {
      value: resultQueue.queueUrl,
      description: 'Result Queue URL',
    });

    new cdk.CfnOutput(this, 'TransactionsTableName', {
      value: transactionsTable.tableName,
      description: 'Transactions DynamoDB Table Name',
    });

    new cdk.CfnOutput(this, 'ResultTopicArn', {
      value: resultTopic.topicArn,
      description: 'Result Topic ARN',
    });
  }
}
