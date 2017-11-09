import {DynamoDB} from 'aws-sdk';
import {Readable, Transform} from 'stream';

export default function limitStream(
	stream: Readable & {LastEvaluatedKey: any},
	limit: number,
	keySchema: DynamoDB.DocumentClient.KeySchema,
): Readable & {LastEvaluatedKey: any} {
	if (limit === Infinity || limit === undefined || limit === null) {
		return stream;
	}
	const limitTransform = new StreamLimiter(limit, keySchema);
	limitTransform.on('end', () => stream.unpipe(limitTransform));

	return stream.pipe(limitTransform);
}

export class StreamLimiter extends Transform {

	public LastEvaluatedKey: DynamoDB.DocumentClient.AttributeMap;

	private lastEvaluatedItem: DynamoDB.DocumentClient.AttributeMap;
	private count = 0;

	constructor(
		private limit: number,
		private keySchema: DynamoDB.DocumentClient.KeySchema,
	) {
		super({objectMode: true});
	}

	public _transform(item: any, enc: any, cb: () => void) {
		if (this.count > this.limit) {
			this.LastEvaluatedKey = getKeyFromElement(this.lastEvaluatedItem, this.keySchema);
			this.push(null);
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
