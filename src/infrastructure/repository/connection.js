const Sequelize = require('sequelize').default;
const assert = require('assert');

const Op = Sequelize.Op;

const getIntValueOrDefault = (value, defaultValue = 0) => {
  if (!value) {
    return defaultValue;
  }
  const int = parseInt(value);
  return isNaN(int) ? defaultValue : int;
};

const makeConnection = (opts) => {
  if (opts && opts.postgresUrl) {
    return new Sequelize(opts.postgresUrl);
  }

  assert(opts.username, 'Database property username must be supplied');
  assert(opts.password, 'Database property password must be supplied');
  assert(opts.host, 'Database property host must be supplied');
  assert(opts.dialect, 'Database property dialect must be supplied, this must be postgres or mssql');


  const databaseName = opts.name || 'postgres';
  const encryptDb = opts.encrypt || false;
  const dbOpts = {
    retry: {
      match: [
        /SequelizeConnectionError/,
        /SequelizeConnectionRefusedError/,
        /SequelizeHostNotFoundError/,
        /SequelizeHostNotReachableError/,
        /SequelizeInvalidConnectionError/,
        /SequelizeConnectionTimedOutError/,
        /TimeoutError/,
      ],
      name: 'query',
      backoffBase: 100,
      backoffExponent: 1.1,
      timeout: 60000,
      max: 5,
    },
    host: opts.host,
    dialect: opts.dialect,
    operatorsAliases: Op,
    dialectOptions: {
      encrypt: encryptDb,
    },
    logging: false,
  };
  if (opts.pool) {
    dbOpts.pool = {
      max: getIntValueOrDefault(opts.pool.max, 5),
      min: getIntValueOrDefault(opts.pool.min, 0),
      acquire: getIntValueOrDefault(opts.pool.acquire, 10000),
      idle: getIntValueOrDefault(opts.pool.idle, 10000),
    };
  }

  return new Sequelize(databaseName, opts.username, opts.password, dbOpts);
};

module.exports = {
  makeConnection,
};
