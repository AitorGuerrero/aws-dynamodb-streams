import {IDynamoDocumentClientAsync} from 'aws-sdk-async';
import DynamoDB = require('aws-sdk/clients/dynamodb');
import {isQueryInput} from './is-query-input';

export function buildScanBlockGenerator(
	documentClient: IDynamoDocumentClientAsync,
	input: DynamoDB.DocumentClient.ScanInput | DynamoDB.DocumentClient.QueryInput,
) {
	const inputIsQuery = isQueryInput(input);

	let lastEvaluatedKey: any = null;
	let sourceIsEmpty = false;

	return async () => {
		if (sourceIsEmpty) {
			return;
		}
		const blockInput = Object.assign({ExclusiveStartKey: lastEvaluatedKey}, input);
		const response = await (inputIsQuery ? documentClient.query(blockInput) : documentClient.scan(blockInput));
		lastEvaluatedKey = response.LastEvaluatedKey;
		if (undefined === lastEvaluatedKey) {
			sourceIsEmpty = true;
		}

		return response;
	};
}
