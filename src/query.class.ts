import {DocumentClient} from 'aws-sdk/lib/dynamodb/document_client';
import {Request} from './request.class';
import QueryInput = DocumentClient.QueryInput;
import QueryOutput = DocumentClient.QueryOutput;

export class Query extends Request<DocumentClient.QueryInput> {
	constructor(
		private documentClient: DocumentClient,
		input: DocumentClient.QueryInput,
	) {
		super(input);
	}

	public async makeQuery(i: QueryInput) {
		return (new Promise<QueryOutput>((rs, rj) => {
			this.documentClient.query(i, (err, result) => err ? rj(err) : rs(result));
		}));
	}
}
