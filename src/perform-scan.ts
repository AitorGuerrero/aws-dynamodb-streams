import * as AWS from 'aws-sdk';
import {IDynamoDocumentClientAsync} from 'aws-sdk-async';
import getLastEvaluatedKey from './get-request-last-evaluated-key';
import {Scan} from './scan.class';

export function performScan(
	asyncDocumentClient: IDynamoDocumentClientAsync,
	request: AWS.DynamoDB.DocumentClient.ScanInput,
) {
	const stream = new Scan(asyncDocumentClient, request);

	return {
		LastEvaluatedKey: getLastEvaluatedKey(stream),
		stream,
	};
}
