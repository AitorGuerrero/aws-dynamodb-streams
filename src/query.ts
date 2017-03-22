import {Request} from './request';
import {DocumentClient} from "aws-sdk/lib/dynamodb/document_client";



export class Query extends Request<DocumentClient.QueryInput, DocumentClient.QueryOutput> {
    constructor(
        documentClient: DocumentClient,
        scanInput: DocumentClient.QueryInput
    ) {
        super(documentClient.query, scanInput);
    }
}