import {IDynamoDocumentClientAsync} from 'aws-sdk-async';
import {DocumentClient} from 'aws-sdk/lib/dynamodb/document_client';
import {Readable} from 'stream';
import LimitStream from './limit.class';
import OffsetStream from './offset-stream.class';
import {Query} from './query.class';
import {Scan} from './scan.class';

export class RecordSet<R> {
	public limit: number;
	public offset: number;
	private innerStream: Readable;

	constructor(
		private dc: IDynamoDocumentClientAsync,
		public request: R & (DocumentClient.ScanInput | DocumentClient.QueryInput),
		limit?: number,
		offset?: number,
	) {
		this.limit = limit || Infinity;
		this.offset = offset || 0;
	}

	public get stream() {
		if (this.innerStream === undefined) {
			const resultStream = isQueryInput(this.request) ? new Query(this.dc, this.request) : new Scan(this.dc, this.request);
			this.innerStream = this.applyLimit(this.applyOffset(resultStream));
		}

		return this.innerStream;
	}

	public get count() {
		const query = Object.assign({Select: 'COUNT'}, this.request);
		const response = isQueryInput(this.request) ? this.dc.query(query) : this.dc.scan(query);

		return response.then((r) => r.Count);
	}

	private applyLimit(resultStream: Readable) {
		let limited: LimitStream;
		if (this.limit === Infinity) {
			return resultStream;
		}
		limited = new LimitStream(this.limit);
		limited.on('end', () => resultStream.unpipe(limited));
		resultStream.on('end', () => limited.push(null));
		resultStream.pipe(limited);

		return limited;
	}

	private applyOffset(resultStream: Readable) {
		if (this.offset === 0) {
			return resultStream;
		}
		const offsetStream = new OffsetStream(this.offset);
		offsetStream.on('end', () => resultStream.unpipe(offsetStream));
		resultStream.on('end', () => offsetStream.push(null));
		resultStream.pipe(offsetStream);

		return resultStream;
	}
}

function isQueryInput(i: DocumentClient.ScanInput | DocumentClient.QueryInput): i is DocumentClient.QueryInput {
	return (i as any).KeyConditionExpression !== undefined;
}
