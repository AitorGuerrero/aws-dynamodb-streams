import {DocumentClient} from 'aws-sdk/lib/dynamodb/document_client';
import {Request} from './request.class';
import ScanInput = DocumentClient.ScanInput;
import ScanOutput = DocumentClient.ScanOutput;

export class Scan extends Request<DocumentClient.QueryInput> {
	constructor(
		private documentClient: DocumentClient,
		input: DocumentClient.QueryInput,
	) {
		super(input);
	}

	public async makeQuery(i: ScanInput) {
		return (new Promise<ScanOutput>((rs, rj) => {
			this.documentClient.scan(i, (err, result) => err ? rj(err) : rs(result));
		}));
	}
}
