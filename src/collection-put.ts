import {DocumentClient} from "aws-sdk/lib/dynamodb/document_client";
import {Transform} from "stream";

export class CollectionPut extends Transform {

    constructor(
        private tableName: string
    ) {
        super({objectMode: true});
    }

    _transform(chunk: any, encoding: any, callback: any) {
        this.push(this.buildWriteRequest(chunk));
        callback();
    }

    private buildWriteRequest(chunk: any): DocumentClient.WriteRequest {
        return {
            [this.tableName]: {
                PutRequest: chunk,
            }
        }
    }
}

