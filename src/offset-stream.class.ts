import {Transform} from 'stream';

export default class OffsetStream extends Transform {

	private count = 0;

	constructor(private offset: number) {
		super({objectMode: true});
	}

	public _transform(item: any, enc: any, cb: any) {
		this.count++;
		if (this.count > this.offset) { this.push(item); }
		cb();
	}
}
