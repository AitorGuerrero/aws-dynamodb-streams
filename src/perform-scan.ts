import {DynamoDB} from 'aws-sdk';
import {IDynamoDocumentClientAsync} from 'aws-sdk-async';
import {Readable} from 'stream';
import getLastEvaluatedKey from './get-request-last-evaluated-key';
import limitStream from './limit-stream';
import {Scan} from './scan.class';

export interface IScanResponse {
	LastEvaluatedKey: DynamoDB.DocumentClient.AttributeMap;
	stream: Readable;
}

export function performScan(
	asyncDocumentClient: IDynamoDocumentClientAsync,
	request: DynamoDB.DocumentClient.ScanInput,
	keySchema: DynamoDB.DocumentClient.KeySchema,
	limit?: number,
): IScanResponse {
	const stream = new Scan(asyncDocumentClient, request);
	const LastEvaluatedKey = getLastEvaluatedKey(stream);

	return {
		LastEvaluatedKey,
		stream: limitStream(stream, limit, keySchema),
	};
}
