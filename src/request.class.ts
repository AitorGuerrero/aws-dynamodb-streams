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

	public LastEvaluatedKey: DocumentClient.AttributeMap;

	private cache: DocumentClient.AttributeMap[];

	constructor(private input: I & Input) {
		super({
			highWaterMark: 0,
			objectMode: true,
		});
		this.cache = [];
		this.LastEvaluatedKey = null;
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
		const result = await this.makeQuery(Object.assign({ExclusiveStartKey: this.LastEvaluatedKey}, this.input));
		this.LastEvaluatedKey = result.LastEvaluatedKey;

		return result.Items || [];
	}

	private isListCompleted() {
		return this.LastEvaluatedKey === undefined;
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
