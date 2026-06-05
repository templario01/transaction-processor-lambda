import { handler } from './transaction';


async function run() {
  try {
    const result = await handler({
      body: JSON.stringify({ transactionId: 'tx-123', amount: 1200 }),
      headers: {
        'content-type': 'application/json',
        host: 'localhost',
      },
      multiValueHeaders: {
        'content-type': ['application/json'],
      },
      httpMethod: 'POST',
      isBase64Encoded: false,
      path: '/transactions',
      pathParameters: null,
      queryStringParameters: null,
      multiValueQueryStringParameters: null,
      stageVariables: null,
      requestContext: {
        accountId: '000000000000',
        resourceId: 'abc123',
        stage: 'prod',
        requestId: 'req-1234',
        resourcePath: '/transactions',
        httpMethod: 'POST',
        path: '/prod/transactions',
        identity: {
          accessKey: null,
          accountId: null,
          apiKey: null,
          caller: null,
          cognitoAuthenticationProvider: null,
          cognitoAuthenticationType: null,
          cognitoIdentityId: null,
          cognitoIdentityPoolId: null,
          sourceIp: '127.0.0.1',
          userAgent: 'curl/8.1.0',
          user: null,
        },
        authorizer: {
          principalId: 'user',
          integrationLatency: 0,
        },
      } as any,
      resource: '/transactions',
    });
    console.log('Lambda Output:', result);
  } catch (error) {
    console.error('Lambda Failed:', error);
  }
}

run();
