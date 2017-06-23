import {Request} from './request';
import {DocumentClient} from 'aws-sdk/lib/dynamodb/document_client';
import ScanInput = DocumentClient.ScanInput;

export class Scan extends Request<DocumentClient.QueryInput> {
    constructor(
        private documentClient: DocumentClient,
        input: DocumentClient.QueryInput
    ) {
        super(input);
    }

    async makeQuery(i: ScanInput) {
    	return (new Promise((rs, rj) => {
        	this.documentClient.scan(i, (err, result) => {
				// console.log('Returned', result.Items.length, 'Scanned', result.ScannedCount, 'LastEvaluatedKey', result.LastEvaluatedKey);
        		if (err) rj(err);
        		else rs(result);
			});
		}))
    }
}