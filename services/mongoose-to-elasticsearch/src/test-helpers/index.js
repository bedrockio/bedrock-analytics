const mongoose = require('mongoose');
const MongoMemoryServer = require('mongodb-memory-server').default;
const { uniqueId } = require('lodash');
const fs = require('fs');
const User = require('../models/user');
const Account = require('../models/account');

exports.context = require('./context');
exports.request = require('./request');
const { ObjectId } = mongoose.Schema.Types;

mongoose.Promise = Promise;

const mongoServer = new MongoMemoryServer();
exports.setupDb = () =>
  new Promise(async (resolve) => {
    mongoServer.getConnectionString().then((mongoUri) => {
      const mongooseOpts = {
        autoReconnect: true,
        reconnectTries: Number.MAX_VALUE,
        reconnectInterval: 1000,
        useNewUrlParser: true,
        useCreateIndex: true
      };

      mongoose.connect(mongoUri, mongooseOpts);

      mongoose.connection.on('error', (e) => {
        if (e.message.code === 'ETIMEDOUT') {
          console.error(e);
          mongoose.connect(mongoUri, mongooseOpts);
        }
        console.error(e);
      });

      mongoose.connection.once('open', () => {
        resolve();
      });
    });
  });

exports.createUser = async (userAttributes = {}) => {
  const account = await Account.create({
    type: 'individual'
  });

  return await User.create({
    email: `${uniqueId('email')}@platform.com`,
    name: 'test user',
    contact: {
      firstName: 'test',
      lastName: 'user'
    },
    defaultLangCode: 'nl',
    accountId: account._id,
    ...userAttributes
  });
};

exports.loadStreamingJson = (path) => {
  const data = fs.readFileSync(path).toString();
  return data
    .split('\n')
    .filter((line) => !!line)
    .map((line) => JSON.parse(line));
};

exports.teardownDb = async () => {
  await mongoServer.stop();
  await mongoose.disconnect();
};
