const process = require('process');
const config = require('@kaareal/config');
const yargs = require('yargs');
const { logger } = require('./../src/lib/logging');
const { connect } = require('./../src/lib/mongodb');
const { indexMongodbCollection } = require('./../src/lib/indexer');

const argv = yargs
  .option('collection-name', {
    description: 'MongoDB collection name'
  })
  .demandOption(['collection-name']).argv;

async function run() {
  const db = await connect();
  const result = await indexMongodbCollection(db, argv['collection-name']);
  logger.info(
    `Detected ${result.total} new documents in collection ${result.collectionName}: numIndexed=${result.numIndexed}, index=${result.index}, duration=${result.duration}ms`
  );
}

run()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    logger.error(`Fatal error: ${error.message}, exiting.`);
    process.exit(1);
  });
