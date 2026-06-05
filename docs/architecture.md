%% Architecture diagram for Transaction Processor
%% Generated using Mermaid flowchart syntax

```mermaid
flowchart LR
  %% Nodes
  API["API Gateway\nPOST /transactions"]
  TLambda["Transaction Lambda\n(save -> DynamoDB, send -> SQS)"]
  DynamoDB[(DynamoDB\nTransactionsTable)]
  ProcessingQueue[(SQS\nprocessing-queue)]
  AntiFraud["Anti-Fraud Lambda\n(validates amount > 2500)"]
  ResultTopic[(SNS\nresult-topic)]
  ResultQueue[(SQS\nresult-queue)]
  ResultHandler["Transaction Result Handler\n(update DynamoDB)"]

  %% Flows
  API -->|HTTP POST| TLambda
  TLambda -->|PutItem (status: pending)| DynamoDB
  TLambda -->|SendMessage (id, amount)| ProcessingQueue
  ProcessingQueue -->|SQS event| AntiFraud
  AntiFraud -->|Publish {id,status}| ResultTopic
  ResultTopic -->|SNS -> SQS subscription| ResultQueue
  ResultQueue -->|SQS event| ResultHandler
  ResultHandler -->|Update status| DynamoDB

  %% Annotations
  subgraph Legend
    direction TB
    A1["Threshold: amount > 2500 → rejected"]
  end

  style API fill:#f9f,stroke:#333,stroke-width:1px
  style TLambda fill:#afe,stroke:#333,stroke-width:1px
  style AntiFraud fill:#fea,stroke:#333,stroke-width:1px
  style ResultHandler fill:#aef,stroke:#333,stroke-width:1px
  style DynamoDB fill:#ffd,stroke:#333,stroke-width:1px
  style ProcessingQueue fill:#fff,stroke:#333,stroke-width:1px
  style ResultQueue fill:#fff,stroke:#333,stroke-width:1px
  style ResultTopic fill:#fff,stroke:#333,stroke-width:1px
```
