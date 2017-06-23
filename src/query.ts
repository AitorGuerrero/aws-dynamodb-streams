import {Request} from './request';
import {DocumentClient} from "aws-sdk/lib/dynamodb/document_client";
import QueryInput = DocumentClient.QueryInput;

export class Query extends Request<DocumentClient.QueryInput> {
    constructor(
        private documentClient: DocumentClient,
        input: DocumentClient.QueryInput
    ) {
        super(input);
    }

    async makeQuery(i: QueryInput) {
        return (new Promise((rs, rj) => {
            this.documentClient.scan(i, (err, result) => {
                if (err) rj(err);
                else rs(result);
            });
        }))
    }
}