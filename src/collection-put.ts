import {DocumentClient} from "aws-sdk/lib/dynamodb/document_client";
import {Transform} from "stream";

export class CollectionPut extends Transform {

    constructor(
        private tableName: string
    ) {
        super({objectMode: true});
    }

    protected _transform(chunk: any, encoding, callback) {
        this.push(this.buildWriteRequest(chunk));
        callback();
    }

    private buildWriteRequest(chunk): DocumentClient.WriteRequest {
        return {
            [this.tableName]: {
                PutRequest: chunk,
            }
        }
    }
}

