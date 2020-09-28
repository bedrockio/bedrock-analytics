const { connect, disconnect } = require('./../mongodb');
const {
  indexMongodbCollection,
  deleteMongodbCollectionIndex,
  refreshMongodbCollectionIndex,
  sanitizeDocuments,
} = require('./../indexer');

let db;

jest.setTimeout(20 * 1000);

beforeAll(async () => {
  db = await connect({ database: 'bedrock_test' });
});

afterAll(async () => {
  db = await disconnect();
});

function createObject() {
  return {
    price: 50.0,
    currency: 'USD',
    variations: [
      { size: 'L', quantity: 100 },
      { size: 'M', quantity: 10 },
    ],
    isPublic: true,
    description: 'Lorem ipsum longo texto',
    createdAt: new Date(),
    updatedAt: new Date(),
    __v: 1,
  };
}

describe('indexer', () => {
  it('should index data from MongoDB', async () => {
    const collection = db.collection('products');
    await collection.deleteMany({});
    const objects = [];
    for (let i = 0; 500 > i; i++) {
      objects.push(createObject());
    }
    await collection.insertMany(objects);
    await deleteMongodbCollectionIndex(db, 'products');
    const { numIndexed, total } = await indexMongodbCollection(db, 'products');
    await refreshMongodbCollectionIndex(db, 'products');
    expect(numIndexed).toBe(objects.length);
    expect(total).toBe(objects.length);
    await collection.insertMany([createObject(), createObject()]);
    const { numIndexed: numIndexed2, total: total2 } = await indexMongodbCollection(db, 'products');
    expect(numIndexed2).toBe(2);
    expect(total2).toBe(2);
  });
  it('should sanitize documents', () => {
    const docs = [{ email: 'test@test.com', name: '123' }];
    expect(sanitizeDocuments('users', docs, ['users.email'])).toEqual([
      {
        name: '123',
      },
    ]);
  });
});
