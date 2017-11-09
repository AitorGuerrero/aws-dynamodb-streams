import {DynamoDB} from 'aws-sdk';
import {IDynamoDocumentClientAsync} from 'aws-sdk-async';
import {Readable} from 'stream';
import getLastEvaluatedKey from './get-request-last-evaluated-key';
import limitStream from './limit-stream';
import {Query} from './query.class';

export interface IQueryResponse {
	LastEvaluatedKey: AWS.DynamoDB.DocumentClient.AttributeMap;
	stream: Readable;
}

export function performQuery(
	asyncDocumentClient: IDynamoDocumentClientAsync,
	request: DynamoDB.DocumentClient.QueryInput,
	keySchema: DynamoDB.DocumentClient.KeySchema,
	limit?: number,
): IQueryResponse {
	const stream = new Query(asyncDocumentClient, request);
	const limitedStream = limitStream(stream, limit, keySchema);
	const LastEvaluatedKey = getLastEvaluatedKey(limitedStream);

	return {
		LastEvaluatedKey,
		stream: limitedStream,
	};
}
