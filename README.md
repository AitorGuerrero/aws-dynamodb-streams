# DynamoDB streams

Power of streams bringed to dynamo DB API. The typescript declarations are the manin documentation.

This package is intended to adapt to the existing use cases, so if your use case is not contemplated, make a pull request.

Current available methods are:

## Put

Writable stream for putting documents in a database. I recommend to use together with CollectionPut.

```typescript
import {Put} from 'aws-dynamodb-streams';
import {DynamoDB} from 'aws-sdk';

let someDocument: any;

const put = new Put(new DynamoDB.DocumentClient());

put.write({
    MyTableName: {
        PutRequest: {
            Item: someDocument,
        },
    },
});
```

## CollectionPut

Writable stream for putting documents in a table. Is a collection specific version of Put.
```typescript
import {Put, CollectionPut} from 'aws-dynamodb-streams';
import {DynamoDB} from 'aws-sdk';

let someDocument: any;

const put = new Put(new DynamoDB.DocumentClient());
const collectionPut = new CollectionPut('MyTableName');
collectionPut.pipe(put);

collectionPut.write(someDocument);
```

## Query

Readable stream for getting documents from a table with a indexed query.

```typescript
import {Query} from 'aws-dynamodb-streams';
import {DynamoDB} from 'aws-sdk';
import {Writable} from 'stream';

let someDocument: any;

const query = new Query(
    new DynamoDB.DocumentClient(),
    {TableName: 'MyTableName'} // aws-sdk/dynamodb/document_client/QueryInput
);

query.pipe(new Writable({
    objectMode: true,
    write(document, ct, cb) {
        // Do something with document
        cb();
    }
}));
```

## Scan

Readable stream for getting documents from a table with a not indexed query.

```typescript
import {Scan} from 'aws-dynamodb-streams';
import {DynamoDB} from 'aws-sdk';
import {Writable} from 'stream';

let someDocument: any;

const scan = new Scan(
    new DynamoDB.DocumentClient(),
    {TableName: 'MyTableName'} // aws-sdk/dynamodb/document_client/ScanInput
);

scan.pipe(new Writable({
    objectMode: true,
    write(document, ct, cb) {
        // Do something with document
        cb();
    }
}));
```