import {Readable} from '@aitor.guerrero/object-stream';
import {DynamoDB} from 'aws-sdk';

export interface Input {
	Limit?: number;
	ExclusiveStartKey?: DynamoDB.DocumentClient.AttributeMap;
}

export interface IOutput {
	LastEvaluatedKey?: DynamoDB.DocumentClient.AttributeMap;
	Items?: DynamoDB.DocumentClient.AttributeMap[];
	Count?: number;
}

export abstract class Request<I> extends Readable {

	public LastEvaluatedKey: Promise<DynamoDB.DocumentClient.AttributeMap>;

	private ExclusiveStartKey: DynamoDB.DocumentClient.AttributeMap;
	private cache: DynamoDB.DocumentClient.AttributeMap[];
	private sourceCompleted: boolean;

	constructor(private input: I & Input) {
		super({highWaterMark: 0});
		this.cache = [];
		this.sourceCompleted = false;
		this.LastEvaluatedKey = new Promise<DynamoDB.DocumentClient.AttributeMap>((rs, rj) => {
			this.on('end', () => {
				rs(this.ExclusiveStartKey);
			});
			this.on('error', rj);
		});
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
			if (this.sourceCompleted) { return null; }
			await this.fillCache();
			if (this.isCacheEmpty()) { return null; }
		}

		return this.cache.shift();
	}

	private async fillCache() {
		do { this.cache = await this.loadBatch(); }
		while (this.isCacheEmpty() && !this.sourceCompleted);
	}

	private async loadBatch(): Promise<DynamoDB.DocumentClient.AttributeMap[]> {
		if (this.sourceCompleted) { return []; }
		const result = await this.makeQuery(Object.assign({ExclusiveStartKey: this.ExclusiveStartKey}, this.input));
		this.ExclusiveStartKey = result.LastEvaluatedKey;
		if (this.ExclusiveStartKey === undefined) {
			this.sourceCompleted = true;
		}

		return result.Items || [];
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
