import {DocumentClient} from "aws-sdk/lib/dynamodb/document_client";
import {Transform} from "stream";

export class CollectionPut extends Transform {

    constructor(
        private tableName: string
    ) {
        super({objectMode: true});
    }

    protected _write(chunk: DocumentClient.WriteRequests, encoding,callback) {
        this.write({[this.tableName]: chunk});
        callback();
    }
}