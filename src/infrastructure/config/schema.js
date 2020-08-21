const SimpleSchema = require('simpl-schema').default;
const { validateConfigAgainstSchema, schemas, patterns } = require('login.dfe.config.schema.common');
const config = require('./index');
const logger = require('./../logger');

const queueStorageSchema = new SimpleSchema({
  connectionString: patterns.redis,
});

const migrationAdminApiClient = new SimpleSchema({
  url: patterns.url,
  auth: Object,
  'auth.type': {
    type: String,
    allowedValues: ['aad', 'secret'],
  },
  'auth.jwt': {
    type: String,
    optional: true,
    custom: function () {
      if (this.siblingField('type').value === 'secret' && !this.isSet) {
        return SimpleSchema.ErrorTypes.REQUIRED
      }
    },
  },
  'auth.tenant': {
    type: String,
    optional: true,
    custom: function () {
      if (this.siblingField('type').value === 'aad' && !this.isSet) {
        return SimpleSchema.ErrorTypes.REQUIRED
      }
    },
  },
  'auth.authorityHostUrl': {
    type: String,
    regEx: /^http(s{0,1}):\/\/.*$/,
    optional: true,
    custom: function () {
      if (this.siblingField('type').value === 'aad' && !this.isSet) {
        return SimpleSchema.ErrorTypes.REQUIRED
      }
    },
  },
  'auth.clientId': {
    type: String,
    optional: true,
    custom: function () {
      if (this.siblingField('type').value === 'aad' && !this.isSet) {
        return SimpleSchema.ErrorTypes.REQUIRED
      }
    },
  },
  'auth.clientSecret': {
    type: String,
    optional: true,
    custom: function () {
      if (this.siblingField('type').value === 'aad' && !this.isSet) {
        return SimpleSchema.ErrorTypes.REQUIRED
      }
    },
  },
  'auth.resource': {
    type: String,
    optional: true,
    custom: function () {
      if (this.siblingField('type').value === 'aad' && !this.isSet) {
        return SimpleSchema.ErrorTypes.REQUIRED
      }
    },
  },
});
const migrationAdminSchema = new SimpleSchema({
  directories: migrationAdminApiClient,
  organisations: migrationAdminApiClient,
});

const notificationsSchema = new SimpleSchema({
  interactionsUrl: patterns.url,
  migrationUrl: patterns.url,
  profileUrl: patterns.url,
  servicesUrl: patterns.url,
  saUrl: patterns.url,
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

const schema = new SimpleSchema({
  loggerSettings: schemas.loggerSettings,
  hostingEnvironment: schemas.hostingEnvironment,
  auth: schemas.apiServerAuth,
  queueStorage: queueStorageSchema,
  persistentStorage: schemas.sequelizeConnection,
  migrationAdmin: migrationAdminSchema,
  notifications: notificationsSchema,
  publicApi: publicApiSchema,
  serviceNotifications: serviceNotificationsSchema,
  concurrency: {
    type: Object,
    optional: true,
    blackbox: true,
  },
});

module.exports.validate = () => {
  validateConfigAgainstSchema(config, schema, logger)
};
