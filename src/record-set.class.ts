import {DocumentClient} from 'aws-sdk/lib/dynamodb/document_client';
import {Duplex, Readable, Transform, Writable} from 'stream';
import {Scan} from './scan';

export default class RecordSet {
	public limit: number;
	public offset: number;
	constructor(
		private dc: DocumentClient,
		private query: DocumentClient.QueryInput,
	) {
		this.limit = Infinity;
		this.offset = 0;
	}
	get count() {
		return new Promise((rs, rj) => {
			this.dc.scan(Object.assign({Select: 'COUNT'}, this.query), (err, data) => {
				if (err) rj(err);
				else rs(data.Count);
			});
		});
	}
	get stream() {
		const scan = new Scan(this.dc, this.query);
		const limited: Readable = this.limit !== Infinity ? scan.pipe(new Limit(this.limit)) : scan;
		const sliced: Readable = this.offset !== 0 ? limited.pipe(new Offset(this.offset)) : limited;

		return sliced;
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