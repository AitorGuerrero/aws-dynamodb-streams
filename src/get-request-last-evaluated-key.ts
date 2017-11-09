import {Request} from './request.class';

export default function getRequestLastEvaluatedKey(stream: Request<any>) {
	return new Promise<AWS.DynamoDB.DocumentClient.AttributeMap>((rs, rj) => {
		stream.on('finish', () => rs(stream.startKey));
		stream.on('error', () => rj());
	});
}
