import {Readable} from '@aitor.guerrero/object-stream';
import {DynamoDB} from 'aws-sdk';
import {IDynamoDocumentClientAsync} from 'aws-sdk-async';

export type IInput = DynamoDB.DocumentClient.ScanInput | DynamoDB.DocumentClient.QueryInput;

export class Request extends Readable {

	public LastEvaluatedKey: Promise<DynamoDB.DocumentClient.AttributeMap>;

	private ExclusiveStartKey: DynamoDB.DocumentClient.AttributeMap;
	private cache: DynamoDB.DocumentClient.AttributeMap[];
	private sourceCompleted: boolean;

	constructor(
		private dc: IDynamoDocumentClientAsync,
		private input: IInput,
	) {
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

	public async _read() {
		try {
			this.push(await this.next());
		} catch (err) {
			this.emit('error', err);
		}
	}

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

	private async loadBatch() {
		if (this.sourceCompleted) { return []; }
		const request = Object.assign({ExclusiveStartKey: this.ExclusiveStartKey}, this.input);
		const result = isQuery(request) ? await this.dc.query(request) : await this.dc.scan(request);
		this.ExclusiveStartKey = result.LastEvaluatedKey;
		if (this.ExclusiveStartKey === undefined) {
			this.sourceCompleted = true;
		}

		return result.Items || [];
	}

	private isCacheEmpty() {
		return this.cache.length === 0;
	}
}

function isQuery(input: any): input is DynamoDB.DocumentClient.QueryInput {
	return input.KeyConditionExpression !== undefined;
}
