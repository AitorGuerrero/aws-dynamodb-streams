import * as AWS from 'aws-sdk';
import {IDynamoDocumentClientAsync} from 'aws-sdk-async';
import getLastEvaluatedKey from './get-request-last-evaluated-key';
import {Query} from './query.class';

export function performQuery(
	asyncDocumentClient: IDynamoDocumentClientAsync,
	request: AWS.DynamoDB.DocumentClient.QueryInput,
) {
	const stream = new Query(asyncDocumentClient, request);

	return {
		LastEvaluatedKey: getLastEvaluatedKey(stream),
		stream,
	};
}
