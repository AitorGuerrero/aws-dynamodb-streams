import {Transform} from 'stream';

export const limitReachedEventName = 'limit-reached';

export default class LimitStream extends Transform {

	private count = 0;

	constructor(private limit: number) {
		super({objectMode: true});
	}

	public _transform(item: any, enc: any, cb: any) {
		if (this.count < this.limit) {
			this.push(item);
			this.count++;
		}
		if (this.count >= this.limit) {
			this.emit(limitReachedEventName);
			this.destroy();
		}
		return cb();
	}
}
