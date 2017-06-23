import {Readable} from 'stream';
import {DocumentClient} from "aws-sdk/lib/dynamodb/document_client";

export interface Input {
    Limit?: number;
    ExclusiveStartKey?: DocumentClient.AttributeMap;
}

export interface Output {
    LastEvaluatedKey?: DocumentClient.AttributeMap;
    Items?: DocumentClient.AttributeMap[];
}

export abstract class Request<I> extends Readable {

    private cache: DocumentClient.AttributeMap[];
	private startKey: DocumentClient.AttributeMap = null;

    abstract makeQuery(i: I): Promise<Output>;

    constructor(
        private input: I & Input
    ) {
        super({
			objectMode: true,
			highWaterMark: 0,
        });
        this.cache = [];
    }

    async _read() {
    	try {
        	this.push(await this.next());
		} catch (err) {
			this.emit('error', err);
		}
    }

    private async next() {
		if (this.isCacheEmpty()) {
			if (this.isListCompleted()) return null;
			await this.fillCache();
	        if (this.isCacheEmpty()) return null;
		}

        return this.cache.shift();
    }

    private async fillCache() {
		do this.cache = await this.loadBatch();
		while(this.isCacheEmpty() && !this.isListCompleted());
	}

    private async loadBatch(): Promise<DocumentClient.AttributeMap[]> {
    	if (this.isListCompleted()) return [];
		const result = await this.makeQuery(Object.assign({ExclusiveStartKey: this.startKey}, this.input));
        this.startKey = result.LastEvaluatedKey;

        return result.Items;
    }

	private isListCompleted() {
    	return this.startKey === undefined;
	}

    private isCacheEmpty() {
    	return this.cache.length === 0;
	}
}