const elasticsearch = require('@elastic/elasticsearch');
const config = require('@kaareal/config');
const { logger } = require('./logging');
const { unset, padStart } = require('lodash');
const { createHash } = require('crypto');
const fs = require('fs');
const path = require('path');
const { Storage } = require('@google-cloud/storage');

const esClient = new elasticsearch.Client({
  node: config.get('ELASTICSEARCH_URI'),
  log: 'error',
});

const sleep = (ms) => {
  return new Promise((r) => setTimeout(r, ms));
};

const updatedAtField = config.get('MONGO_UPDATED_AT_FIELD');

const defaultMongodbMapping = {
  dynamic_templates: [
    {
      strings_as_keywords: {
        match_mapping_type: 'string',
        mapping: {
          type: 'keyword',
        },
      },
    },
  ],
  properties: {
    [updatedAtField]: {
      type: 'date',
    },
  },
};

function indexNameForMongodbCollection(db, collectionName) {
  return `mongodb-${collectionName}`;
}

async function refreshIndex(index) {
  await esClient.indices.refresh({ index });
}

async function deleteIndex(index) {
  const existsResult = await esClient.indices.exists({ index });
  if (existsResult.statusCode === 200) {
    await esClient.indices.delete({ index });
  }
}

async function ensureIndex(index, { recreate = false } = {}) {
  const existsResult = await esClient.indices.exists({ index });
  if (recreate && existsResult.statusCode === 200) {
    await esClient.indices.delete({ index });
  }
  const existsResult2 = await esClient.indices.exists({ index });
  if (!(existsResult2.statusCode === 200)) {
    await esClient.indices.create({
      index,
      body: {
        mappings: defaultMongodbMapping,
      },
    });
  }
}

async function refreshMongodbCollectionIndex(db, collectionName) {
  const index = indexNameForMongodbCollection(db, collectionName);
  await refreshIndex(index);
}

async function deleteMongodbCollectionIndex(db, collectionName) {
  const index = indexNameForMongodbCollection(db, collectionName);
  await deleteIndex(index);
}

async function readCursor(cursor, limit) {
  const docs = [];
  const items = new Array(limit);
  for (const item of items) {
    const doc = await cursor.next();
    if (!doc) break;
    docs.push(doc);
  }
  return docs;
}

function flatten(arr) {
  return arr.reduce(function (flat, toFlatten) {
    return flat.concat(Array.isArray(toFlatten) ? flatten(toFlatten) : toFlatten);
  }, []);
}

function createBatchHash(events) {
  const md5 = createHash('md5');
  const str = events.map((e) => e._id.toString()).join(':');
  md5.update(str);
  return md5.digest('hex');
}

function createDateString(date) {
  return `${date.getFullYear()}-${padStart(`${date.getMonth() + 1}`, 2, '0')}-${padStart(`${date.getDate()}`, 2, '0')}`;
}

async function indexDocuments(index, documents) {
  const esDocs = documents.map((rawDoc) => {
    const doc = Object.assign({}, rawDoc);
    const id = doc._id.toString();
    delete doc._id;
    return {
      ...doc,
      id,
    };
  });
  const body = flatten(esDocs.map((doc) => [{ index: { _index: index, _id: doc.id } }, doc]));
  const { body: bulkResponse } = await esClient.bulk({ body });
  if (bulkResponse.errors) {
    const erroredDocuments = [];
    // The items array has the same order of the dataset we just indexed.
    // The presence of the `error` key indicates that the operation
    // that we did for the document has failed.
    bulkResponse.items.forEach((action, i) => {
      const operation = Object.keys(action)[0];
      if (action[operation].error) {
        erroredDocuments.push({
          // If the status is 429 it means that you can retry the document,
          // otherwise it's very likely a mapping error, and you should
          // fix the document before to try it again.
          status: action[operation].status,
          error: action[operation].error,
          operation: body[i * 2],
          document: body[i * 2 + 1],
        });
      }
    });
    logger.warn(`Could not bulk index docs into ES: ${JSON.stringify(erroredDocuments)}`);
  }
}

function sanitizeDocuments(collectionName, docs, attributes = null) {
  if (!attributes) {
    attributes = config.get('MONGO_EXCLUDE_ATTRIBUTES').split(/\,\s*/);
  }
  const collectionAttributes = [];
  attributes.forEach((attribute) => {
    if (attribute.match(new RegExp(`^${collectionName}`))) {
      collectionAttributes.push(attribute.split('.').slice(1));
    }
  });
  if (!collectionAttributes.length) {
    return docs;
  }
  return docs.map((doc) => {
    collectionAttributes.forEach((path) => {
      unset(doc, path);
    });
    return doc;
  });
}

async function syncMongodbCollection(
  db,
  collectionName,
  index,
  query = {},
  options = { enableHistorical: false, bucketName: undefined }
) {
  const collection = db.collection(collectionName);
  const startTs = Date.now();
  const total = await collection.countDocuments(query);
  let numIndexed = 0;
  if (total > 0) {
    logger.info(`Indexing ${index}`);
    const batchSize = 10000;
    const cursor = collection.find(query, { timeout: false }).sort({ [updatedAtField]: -1 });

    const numBatches = Math.ceil(total / batchSize);
    const batches = new Array(numBatches);
    let i = 0;
    for (const batch of batches) {
      i += 1;
      const result = await readCursor(cursor, batchSize);
      if (result.length) {
        const sanitizedResult = sanitizeDocuments(collectionName, result);
        await indexDocuments(index, sanitizedResult);
      }
      numIndexed += result.length;
    }
  }
  return { total, numIndexed, duration: Date.now() - startTs };
}

async function indexMongodbCollection(
  db,
  collectionName,
  options = { enableHistorical: false, bucketName: undefined }
) {
  const index = indexNameForMongodbCollection(db, collectionName);
  await ensureIndex(index);
  const sort = [
    {
      [updatedAtField]: {
        order: 'desc',
      },
    },
  ];
  const { body } = await esClient.search({
    index,
    body: {
      sort,
      size: 1,
    },
  });
  const { hits } = body;
  const lastEntry = hits.hits[0];
  let query = {};
  if (lastEntry) {
    query[updatedAtField] = {
      $gt: new Date(lastEntry._source[updatedAtField]),
    };
  }
  const stats = await syncMongodbCollection(db, collectionName, index, query, options);
  return {
    ...stats,
    collectionName,
    index,
  };
}

function autoIndexMongodbCollections(db, collectionNames, intervalSeconds = 30) {
  logger.info(
    `Starting auto indexing for MongoDB collections: ${collectionNames.join(',')}, Elasticsearch URI = ${config.get(
      'ELASTICSEARCH_URI'
    )}`
  );
  return new Promise((resolve, reject) => {
    function run() {
      const jobs = collectionNames.map((collectionName) => {
        return indexMongodbCollection(db, collectionName, {});
      });
      Promise.all(jobs)
        .then((results) => {
          results.forEach((result) => {
            if (result.total > 0) {
              logger.info(
                `Detected ${result.total} new documents in collection ${result.collectionName}: numIndexed=${result.numIndexed}, index=${result.index}, duration=${result.duration}ms`
              );
            }
          });
          setTimeout(run, intervalSeconds * 1000);
        })
        .catch((error) => {
          console.error(`Error while running auto index jobs: ${error.message}`);
          console.error(error.stack);
          reject(error);
        });
    }
    run();
  });
}

async function searchIndex(index, size = 10000) {
  const { body } = await esClient.search({
    index,
    body: {
      size,
    },
  });
  const { hits } = body;
  return hits.hits;
}

module.exports = {
  deleteIndex,
  refreshIndex,
  ensureIndex,
  indexMongodbCollection,
  deleteMongodbCollectionIndex,
  refreshMongodbCollectionIndex,
  autoIndexMongodbCollections,
  sanitizeDocuments,
  indexNameForMongodbCollection,
  searchIndex,
  createDateString,
};
