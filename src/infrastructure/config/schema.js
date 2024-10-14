const SimpleSchema = require('simpl-schema').default;
const { validateConfigAgainstSchema, schemas, patterns } = require('login.dfe.config.schema.common');
const config = require('./index');
const logger = require('./../logger');

const queueStorageSchema = new SimpleSchema({
  connectionString: patterns.redis,
});


const adapterSchema = new SimpleSchema({
  type: {
    type: String,
    allowedValues: ['file', 'redis', 'mongo', 'azuread', 'sequelize'],
  },
  directories: {
    type: schemas.sequelizeConnection,
    optional: true,
  },
  organisation: {
    type: schemas.sequelizeConnection,
    optional: true,
  },
});

const notificationsSchema = new SimpleSchema({
  interactionsUrl: patterns.url,
  profileUrl: patterns.url,
  servicesUrl: patterns.url,
  helpUrl: patterns.url,
  feConnectUrl: patterns.url,
  supportEmailAddress: String,
  organisations: schemas.apiClient,
  directories: schemas.apiClient,
  email: Object,
  'email.type': {
    type: String,
    allowedValues: ['disk', 's3', 'ses']
  },
  'email.params': {
    type: Object,
    blackbox: true,
  },
  sms: Object,
  'sms.type': {
    type: String,
    allowedValues: ['disk', 'GovNotify']
  },
  'sms.params': {
    type: Object,
    blackbox: true,
  },
  slackWebHookUrl: String,
  envName: String
});

const publicApiSchema = new SimpleSchema({
  directories: schemas.apiClient,
  organisations: schemas.apiClient,
  applications: schemas.apiClient,
  auth: Object,
  'auth.jwtSecret': String,
});

const serviceNotificationsSchema = new SimpleSchema({
  access: schemas.apiClient,
  organisations: schemas.apiClient,
  applications: schemas.apiClient,
  directories: schemas.apiClient,
});

const entraSchema = new SimpleSchema({
  enableEntraSignIn: {
    type: Boolean,
    optional: true,
    defaultValue: false,
  },
});

const schema = new SimpleSchema({
  loggerSettings: schemas.loggerSettings,
  hostingEnvironment: schemas.hostingEnvironment,
  auth: schemas.apiServerAuth,
  queueStorage: queueStorageSchema,
  persistentStorage: schemas.sequelizeConnection,
  notifications: notificationsSchema,
  publicApi: publicApiSchema,
  serviceNotifications: serviceNotificationsSchema,
  concurrency: {
    type: Object,
    optional: true,
    blackbox: true,
  },
  adapter: adapterSchema,
  entra: entraSchema,
});

module.exports.validate = () => {
  validateConfigAgainstSchema(config, schema, logger)
};
