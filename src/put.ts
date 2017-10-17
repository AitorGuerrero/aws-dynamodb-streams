import {DocumentClient} from 'aws-sdk/lib/dynamodb/document_client';
import {Writable} from 'stream';

export class Put extends Writable {

	protected batchRequests: DocumentClient.BatchWriteItemRequestMap;

	constructor(private documentClient: DocumentClient) {
		super({objectMode: true});
		this.batchRequests = {};
		this.on('finish', () => this.flush());
	}

	public _write(chunk: DocumentClient.BatchWriteItemRequestMap, encoding: any, callback: any) {
		Object.keys(chunk).forEach((tableName) => {
			if (!Array.isArray(this.batchRequests[tableName])) {
				this.batchRequests[tableName] = [];
			}
			chunk[tableName].forEach((document) => this.batchRequests[tableName].push(document));
		});
		callback();
	}

	public async flush() {
		let error: Error;
		await new Promise((rs, rj) => {
			this.documentClient.batchWrite({
				RequestItems: this.batchRequests,
			}, (err: Error) => {
				error = err;
				err ? rj(err) : rs();
			});
		});
		this.emit('flushed', error);
	}
}
