
deploy:
	aws cloudformation deploy --template-file cdk.out/TransactionProcessorStack.template.json --stack-name payments-stack --endpoint-url http://localhost:4566

destroy:
	aws cloudformation delete-stack --stack-name payments-stack --endpoint-url http://localhost:4566