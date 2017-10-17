import {Transform} from 'stream';

export default class LimitStream extends Transform {

	private count = 0;

	constructor(private limit: number) {
		super({objectMode: true});
	}

	public _transform(item: any, enc: any, cb: any) {
		if (this.count >= this.limit) {
			this.destroy();
		}
		this.count++;
		this.push(item);
		if (this.count >= this.limit) { this.push(null); }
		return cb();
	}
}
