const config = require('@kaareal/config');
const MongoClient = require('mongodb').MongoClient;
const { logger } = require('./logging');

let client;

async function connect(options = {}) {
  const url = config.get('MONGO_URI');
  client = new MongoClient(url, { useUnifiedTopology: true });
  return new Promise((accept, reject) => {
    client.connect(function(err) {
      if (err) return reject(err);
      logger.info(`Connected successfully to MongoDB server: ${url}`);
      const db = client.db(options.database);
      accept(db);
    });
  });
}

async function disconnect() {
  client.close();
}

module.exports = {
  connect,
  disconnect
};
