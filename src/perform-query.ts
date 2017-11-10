import {DynamoDB} from 'aws-sdk';
import {IDynamoDocumentClientAsync} from 'aws-sdk-async';
import {Readable} from 'stream';
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
	const query = new Query(asyncDocumentClient, request);
	const limited = limitStream(query, limit, keySchema);

	return {
		LastEvaluatedKey: limited.LastEvaluatedKey,
		stream: limited,
	};
}
