import {DocumentClient} from 'aws-sdk/lib/dynamodb/document_client';
import {Readable} from 'stream';

export interface Input {
	Limit?: number;
	ExclusiveStartKey?: DocumentClient.AttributeMap;
}

export interface IOutput {
	LastEvaluatedKey?: DocumentClient.AttributeMap;
	Items?: DocumentClient.AttributeMap[];
	Count?: number;
}

export abstract class Request<I> extends Readable {

	private cache: DocumentClient.AttributeMap[];
	private startKey: DocumentClient.AttributeMap = null;

	constructor(private input: I & Input) {
		super({
			highWaterMark: 0,
			objectMode: true,
		});
		this.cache = [];
	}

	public async count() {
		return (await this.makeQuery(this.composeCountInput())).Count;
	}

	public async _read() {
		try {
			this.push(await this.next());
		} catch (err) {
			this.emit('error', err);
		}
	}

	protected abstract makeQuery(i: I): Promise<IOutput>;

	private async next() {
		if (this.isCacheEmpty()) {
			if (this.isListCompleted()) { return null; }
			await this.fillCache();
			if (this.isCacheEmpty()) { return null; }
		}

		return this.cache.shift();
	}

	private async fillCache() {
		do { this.cache = await this.loadBatch(); }
		while (this.isCacheEmpty() && !this.isListCompleted());
	}

	private async loadBatch(): Promise<DocumentClient.AttributeMap[]> {
		if (this.isListCompleted()) { return []; }
		const result = await this.makeQuery(Object.assign({ExclusiveStartKey: this.startKey}, this.input));
		this.startKey = result.LastEvaluatedKey;

		return result.Items;
	}

	private isListCompleted() {
		return this.startKey === undefined;
	}

	private isCacheEmpty() {
		return this.cache.length === 0;
	}

	private composeCountInput() {
		return Object.assign({}, this.input, {
			Limit: undefined,
			Select: 'COUNT',
		});
	}
}
