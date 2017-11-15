import {Readable} from '@aitor.guerrero/object-stream';
import {DynamoDB} from 'aws-sdk';
import {IDynamoDocumentClientAsync} from 'aws-sdk-async';
import limitStream from './limit-stream';
import {Request} from './request.class';

export interface IQueryResponse {
	LastEvaluatedKey: AWS.DynamoDB.DocumentClient.AttributeMap;
	stream: Readable;
}

export function performRequest(
	asyncDocumentClient: IDynamoDocumentClientAsync,
	request: DynamoDB.DocumentClient.QueryInput,
	keySchema: DynamoDB.DocumentClient.KeySchema,
	limit?: number,
): IQueryResponse {
	const query = new Request(asyncDocumentClient, request);
	const limited = limitStream(query, limit, keySchema);

	return {
		LastEvaluatedKey: limited.LastEvaluatedKey,
		stream: limited,
	};
}
