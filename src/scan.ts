import {Readable} from 'stream';
import {DocumentClient} from "aws-sdk/lib/dynamodb/document_client";

export default class Scan extends Readable {

    private reading: boolean;
    private listCompleted: boolean;
    private cache: DocumentClient.AttributeMap[];
    private cachePos: number;

    constructor(
        private documentClient: DocumentClient,
        private scanInput: DocumentClient.ScanInput
    ) {
        super({ objectMode: true });
        this.reading = false;
        this.cache = [];
        this.cachePos = 0;
        this.listCompleted = false;
    }

    async _read() {
        this.push(await this.next());
    }

    private async next() {
        if (this.cachePos >= this.cache.length) {
            if (this.listCompleted) return null;
            await this.loadBatch();
            this.cachePos = 0;
        }
        return this.cache[this.cachePos++];
    }

    private async loadBatch() {
        const result = await (new Promise<DocumentClient.ScanOutput>((rs, rj) => {
            this.documentClient.scan(this.scanInput, (err: Error, result: any) => {
                if (err) rj(err);
                else rs(result);
            });
        }));
        this.listCompleted = result.LastEvaluatedKey === undefined;
        this.scanInput.ExclusiveStartKey = result.LastEvaluatedKey;
        this.cache = result.Items;
    }
}