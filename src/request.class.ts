import {Readable} from '@aitor.guerrero/object-stream';
import {DynamoDB} from 'aws-sdk';
import {IDynamoDocumentClientAsync} from 'aws-sdk-async';
import {buildDynamoItemGenerator} from './item-generator.functor';

export type IInput = DynamoDB.DocumentClient.ScanInput | DynamoDB.DocumentClient.QueryInput;

export class Request extends Readable {

	private next: () => Promise<DynamoDB.DocumentClient.AttributeMap>;

	constructor(
		private dc: IDynamoDocumentClientAsync,
		private input: IInput,
	) {
		super({highWaterMark: 0});
		this.next = buildDynamoItemGenerator(dc, input);
	}

	public async _read() {
		try {
			const item = await this.next();
			this.push(item === undefined ? null : item);
		} catch (err) {
			this.emit('error', err);
		}
	}
}
