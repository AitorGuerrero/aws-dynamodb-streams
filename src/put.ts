import {Writable} from "stream";
import {DocumentClient} from "aws-sdk/lib/dynamodb/document_client";

export class Put extends Writable {

    batchRequests: DocumentClient.BatchWriteItemRequestMap;

    constructor(
        private documentClient: DocumentClient
    ) {
        super({objectMode: true});
        this.batchRequests = {};
        this.on('finish', () => this.flush());
    }

    protected _write(chunk: DocumentClient.BatchWriteItemRequestMap, encoding,callback) {
        Object.keys(chunk).forEach(tableName => {
            if (!Array.isArray(this.batchRequests[tableName])) this.batchRequests[tableName] = [];
            chunk[tableName].forEach(document => this.batchRequests[tableName].push(document));
        });
        callback();
    }

    async flush() {
        let error: Error = undefined;
        await new Promise((rs, rj) => {
            this.documentClient.batchWrite({
                RequestItems: this.batchRequests,
            }, (err: Error) => {
                error = err;
                if (err) rj(err);
                else rs();
            });
        });
        this.emit('flushed', error);
    }
}