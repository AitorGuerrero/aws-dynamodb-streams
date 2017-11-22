import {DynamoDB} from 'aws-sdk';
import {IDynamoDocumentClientAsync} from 'aws-sdk-async';
import {buildScanBlockGenerator} from './request-block-generator.functor';

export function buildDynamoItemGenerator(
	documentClient: IDynamoDocumentClientAsync,
	input: DynamoDB.DocumentClient.ScanInput | DynamoDB.DocumentClient.QueryInput,
) {
	const getNextBlock = buildScanBlockGenerator(documentClient, input);

	let batch: any[] = [];
	let sourceIsEmpty = false;

	return async () => {
		if (batch === undefined || batch.length === 0 && sourceIsEmpty) {
			return;
		}
		if (batch.length === 0) {
			const dynamoResponse = await getNextBlock();
			batch = dynamoResponse.Items;
			sourceIsEmpty = dynamoResponse.LastEvaluatedKey === undefined;
			if (batch === undefined) {
				return;
			}
		}

		return batch.shift();
	};
}
