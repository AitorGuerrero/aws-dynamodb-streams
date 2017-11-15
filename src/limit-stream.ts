import {Readable, Transform} from '@aitor.guerrero/object-stream';
import {DynamoDB} from 'aws-sdk';

export default function limitStream(
	stream: Readable & {LastEvaluatedKey: any},
	limit: number,
	keySchema: DynamoDB.DocumentClient.KeySchema,
): Readable & {LastEvaluatedKey: any} {
	if (limit === Infinity || limit === undefined || limit === null) {
		return stream;
	}
	const limitTransform = new StreamLimiter(limit, keySchema);
	limitTransform.on('limit-reached', () => stream.unpipe(limitTransform));

	return stream.pipe(limitTransform);
}

export class StreamLimiter extends Transform {

	public LastEvaluatedKey: Promise<DynamoDB.DocumentClient.AttributeMap>;

	private lastEvaluatedItem: DynamoDB.DocumentClient.AttributeMap;
	private count = 0;

	constructor(
		private limit: number,
		private keySchema: DynamoDB.DocumentClient.KeySchema,
	) {
		super({objectMode: true});
		this.LastEvaluatedKey = new Promise<DynamoDB.DocumentClient.AttributeMap>((rs, rj) => {
			this.on('limit-reached', () => rs(getKeyFromElement(this.lastEvaluatedItem, this.keySchema)));
			this.on('error', rj);
		});
	}

	public _transform(item: any, enc: any, cb: () => void) {
		if (this.count >= this.limit) {
			this.emit('limit-reached');
			this.end();
		} else {
			this.count++;
			this.lastEvaluatedItem = item;
			this.push(item);
		}
		cb();
	}
}

function getKeyFromElement(el: any, keySchema: DynamoDB.DocumentClient.KeySchema) {
	return keySchema.reduce((key, keySchemaElement) => {
		key[keySchemaElement.AttributeName] = el[keySchemaElement.AttributeName];

		return key;
	}, {} as DynamoDB.DocumentClient.AttributeMap);
}
