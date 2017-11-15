import {Readable} from '@aitor.guerrero/object-stream';
import {DynamoDB} from 'aws-sdk';
import {IDynamoDocumentClientAsync} from 'aws-sdk-async';
import {expect} from 'chai';
import 'mocha';
import {performRequest} from './perform-request';

describe('Performing a request', () => {
	let scanStream: Readable;
	let documentClient: IDynamoDocumentClientAsync;
	let request: DynamoDB.DocumentClient.ScanInput;
	let dynamoResponse: DynamoDB.DocumentClient.ScanOutput[];
	let keySchema: DynamoDB.DocumentClient.KeySchema;
	beforeEach(() => {
		documentClient = {scan: () => dynamoResponse.shift()} as any;
		keySchema = [];
		request = {} as any;
		scanStream = performRequest(documentClient, request, keySchema).stream;
	});
	describe('When dynamo fails', () => {
		const error = new Error('TEST ERROR');
		beforeEach(() => {
			documentClient.scan = () => { throw error; };
		});
		it ('stream should emit the error', async () => {
			const response = performRequest(documentClient, request, keySchema);
			try {
				response.stream.resume();
				await response.stream.ended;

				throw new Error('Should throw error');
			} catch (err) {
				expect(err).to.be.eq(error);
			}
		});
	});
	describe('When dynamo responds no items', () => {
		beforeEach(() => dynamoResponse = [{}]);
		it('Stream should emit end event', async () => {
			const response = performRequest(documentClient, request, keySchema);
			response.stream.resume();
			await response.stream.ended;
		});
	});
	describe('When dynamo responds various batches', () => {
		beforeEach(() => dynamoResponse = [
			{Items: [{id: 'a'}], LastEvaluatedKey: {id: 'a'}},
			{Items: [{id: 'b'}], LastEvaluatedKey: {id: 'b'}},
			{Items: [{id: 'c'}]},
		]);
		it('Should return all the items', async () => {
			const response = performRequest(documentClient, request, keySchema);
			const data: any[] = [];
			response.stream.on('data', (e) => data.push(e));
			await response.stream.ended;
			expect(data.length).to.be.eq(3);
			expect(data[0].id).to.be.eq('a');
			expect(data[1].id).to.be.eq('b');
			expect(data[2].id).to.be.eq('c');
		});
	});
});
