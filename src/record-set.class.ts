import {DocumentClient} from 'aws-sdk/lib/dynamodb/document_client';
import {Readable} from 'stream';
import LimitStream from './limit.class';
import OffsetStream from './offset-stream';
import {Query} from './query';
import {Scan} from './scan';

export default class RecordSet<R> {
	public limit: number;
	public offset: number;
	private innerStream: Readable;

	constructor(
		private dc: DocumentClient,
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
		return new Promise<number>((rs, rj) => {
			if (isQueryInput(this.request)) {
				this.dc.query(query, (err, data) => err ? rj(err) : rs(data.Count));
			} else {
				this.dc.scan(query, (err, data) => err ? rj(err) : rs(data.Count));
			}
		});
	}

	private applyLimit(resultStream: Readable) {
		let limited: Readable;
		if (this.limit !== Infinity) {
			const limitStream = new LimitStream(this.limit);
			limited = resultStream.pipe(limitStream);
			limitStream.on('error', () => resultStream.unpipe(limitStream));
		} else {
			limited = resultStream;
		}

		return limited;
	}
}

function isQueryInput(i: DocumentClient.ScanInput | DocumentClient.QueryInput): i is DocumentClient.QueryInput {
	return (i as any).KeyConditionExpression !== undefined;
}
