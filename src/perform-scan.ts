import {DynamoDB} from 'aws-sdk';
import {IDynamoDocumentClientAsync} from 'aws-sdk-async';
import {Readable} from 'stream';
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
	const scan = new Scan(asyncDocumentClient, request);
	const limited = limitStream(scan, limit, keySchema);

	return {
		LastEvaluatedKey: limited.LastEvaluatedKey,
		stream: limited,
	};
}
