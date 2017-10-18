import {IDynamoDocumentClientAsync} from 'aws-sdk-async';
import {DocumentClient} from 'aws-sdk/lib/dynamodb/document_client';
import {Request} from './request.class';

export class Scan extends Request<DocumentClient.QueryInput> {
	constructor(
		private documentClient: IDynamoDocumentClientAsync,
		input: DocumentClient.QueryInput,
	) {
		super(input);
	}

	public async makeQuery(i: DocumentClient.ScanInput) {
		return this.documentClient.scan(i);
	}
}
