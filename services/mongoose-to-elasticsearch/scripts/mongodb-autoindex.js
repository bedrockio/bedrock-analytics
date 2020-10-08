const process = require('process');
const config = require('@kaareal/config');
const { logger } = require('./../src/lib/logging');
const { connect } = require('./../src/lib/mongodb');
const { autoIndexMongodbCollections } = require('./../src/lib/indexer');

async function run() {
  const db = await connect();
  const collectionNames = config.get('MONGO_COLLECTIONS_TO_INDEX').split(/\,\s*/);
  const intervalSeconds = parseInt(config.get('MONGO_INDEXER_INTERVAL_SECONDS'), 10);
  await autoIndexMongodbCollections(db, collectionNames, intervalSeconds);
}

run()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    logger.error(`Fatal error: ${error.message}, exiting.`);
    logger.error(error.stack);
    process.exit(1);
  });
