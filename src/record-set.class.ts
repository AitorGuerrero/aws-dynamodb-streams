import {DocumentClient} from 'aws-sdk/lib/dynamodb/document_client';
import {Duplex, Readable, Transform, Writable} from 'stream';
import {Scan} from './scan';
import {Query} from './query';

export default class RecordSet<R> {
	public limit: number;
	public offset: number;
	private _stream: Readable;
	constructor(
		private dc: DocumentClient,
		public request: R & (DocumentClient.ScanInput | DocumentClient.QueryInput),
	) {
		this.limit = Infinity;
		this.offset = 0;
	}
	get count() {
		const query = Object.assign({Select: 'COUNT'}, this.request);
		return new Promise<number>((rs, rj) => {
			if (isQueryInput(this.request))
				this.dc.query(query, (err, data) => err ? rj(err): rs(data.Count));
			else
				this.dc.scan(query, (err, data) => err ? rj(err): rs(data.Count));
		});
	}
	get stream() {
		if (this._stream === undefined) {
			const resultStream = isQueryInput(this.request) ? new Query(this.dc, this.request) : new Scan(this.dc, this.request);
			const limited: Readable = this.limit !== Infinity ? resultStream.pipe(new Limit(this.limit)) : resultStream;
			this._stream = this.offset !== 0 ? limited.pipe(new Offset(this.offset)) : limited;
		}

		return this._stream;
	}
}



class Limit extends Transform {

	private count = 0;

	constructor(private limit: number) {
		super({objectMode: true});
	}

	_transform(item: any, enc: any, cb: any) {
		if (this.count >= this.limit) return cb();
		this.count++;
		this.push(item);
		if (this.count >= this.limit) this.push(null);
		return cb();
	}
}

class Offset extends Transform {

	private count = 0;

	constructor(private offset: number) {
		super({objectMode: true});
	}

	_transform(item: any, enc: any, cb: any) {
		this.count++;
		if (this.count > this.offset) this.push(item);
		cb();
	}
}

function isQueryInput(i: DocumentClient.ScanInput | DocumentClient.QueryInput): i is DocumentClient.QueryInput {
	return (i as any).KeyConditionExpression !== undefined;
}