import {Readable} from 'stream';

export default function getRequestLastEvaluatedKey(stream: Readable & {LastEvaluatedKey: any}) {
	return new Promise<AWS.DynamoDB.DocumentClient.AttributeMap>((rs, rj) => {
		stream.on('end', () => rs(stream.LastEvaluatedKey));
		stream.on('error', () => rj());
	});
}
