import {DynamoDB} from 'aws-sdk';

export function isQueryInput(input: any): input is DynamoDB.DocumentClient.QueryInput {
	return input.KeyConditionExpression !== undefined;
}
