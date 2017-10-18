import {IDynamoDocumentClientAsync} from 'aws-sdk-async';
import {DocumentClient} from 'aws-sdk/lib/dynamodb/document_client';
import {Readable} from 'stream';
import LimitStream, {limitReachedEventName} from './limit.class';
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
	) {
		this.limit = Infinity;
		this.offset = 0;
	}

	public get stream() {
		if (this.innerStream === undefined) {
			const resultStream = isQueryInput(this.request) ? new Query(this.dc, this.request) : new Scan(this.dc, this.request);
			const limited = this.applyLimit(resultStream);
			this.innerStream = this.offset !== 0 ? limited.pipe(new OffsetStream(this.offset)) : limited;
		}

		return this.innerStream;
	}

	public get count() {
		const query = Object.assign({Select: 'COUNT'}, this.request);
		const response = isQueryInput(this.request) ? this.dc.query(query) : this.dc.scan(query);

		return response.then((r) => r.Count);
	}

	private applyLimit(resultStream: Readable) {
		let limited: Readable;
		if (this.limit !== Infinity) {
			const limitStream = new LimitStream(this.limit);
			limited = resultStream.pipe(limitStream);
			limitStream.on(limitReachedEventName, () => resultStream.unpipe(limitStream));
		} else {
			limited = resultStream;
		}

		return limited;
	}
}

function isQueryInput(i: DocumentClient.ScanInput | DocumentClient.QueryInput): i is DocumentClient.QueryInput {
	return (i as any).KeyConditionExpression !== undefined;
}
