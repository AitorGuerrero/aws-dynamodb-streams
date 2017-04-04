import {Readable} from 'stream';
import {DocumentClient} from "aws-sdk/lib/dynamodb/document_client";

export interface Input {
    Limit?: number;
    ExclusiveStartKey?: DocumentClient.AttributeMap;
}

export interface Output {
    LastEvaluatedKey: DocumentClient.AttributeMap;
    Items: DocumentClient.AttributeMap[];
}

export class Request<I, O> extends Readable {

    private reading: boolean;
    private listCompleted: boolean;
    private cache: DocumentClient.AttributeMap[];
    private cachePos: number;
    private left: number;

    constructor(
        private makeQuery: (i: I, callback: (err: Error, o: O & Output) => void) => void,
        private input: I & Input
    ) {
        super({ objectMode: true });
        this.reading = false;
        this.cache = [];
        this.cachePos = 0;
        this.listCompleted = false;
        this.left = input.Limit || Infinity;
    }

    async _read() {
    	try {
        	this.push(await this.next());
		} catch (err) {
			this.emit('error', err);
		}
    }

    private async next() {
        if (this.cachePos >= this.cache.length) {
            if (this.listCompleted) return null;
			await this.loadBatch();
            if (this.cache.length === 0) return null;
            this.cachePos = 0;
        }
        return this.cache[this.cachePos++];
    }

    private async loadBatch() {
    	if (this.listCompleted) return;
        const result = await (new Promise<O & Output>((rs, rj) => {
            this.makeQuery(this.input, (err, result) => {
                if (err) rj(err);
                else rs(result);
            });
        }));
        this.left -= result.Items.length;
        this.input.ExclusiveStartKey = result.LastEvaluatedKey;
		this.input.Limit = this.left !== Infinity ? this.left : undefined;
        this.listCompleted = this.input.ExclusiveStartKey === undefined || this.left <= 0;
        this.cache = result.Items;
    }
}