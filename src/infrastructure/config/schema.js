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

const govNotifyEmailTemplatesSchema = new SimpleSchema({
  // Access requests
  approverRequestAccess: String,
  userAddedToOrganisation: String,
  userPermissionLevelChanged: String,
  userRemovedFromOrganisation: String,
  userRequestForOrganisationAccessApproved: String,
  userRequestForOrganisationAccessRejected: String,
  userRequestForServiceApprovedV1: String,
  userRequestForServiceApprovedV2: String,
  userRequestForServiceRejected: String,
  userRequestsForSubServicesApproved: String,
  userRequestsForSubServicesRejected: String,
  userRequestToApproverForServiceAccess: String,
  userRequestToApproverForSubServiceAccess: String,
  userServiceRemoved: String,

  // Entra migration

  // Profile
  notifyChangeEmailAddress: String,
  verifyChangeEmailAddress: String,
  verifyPasswordResetRequest: String,

  // Support
  supportRequest: String,
  supportRequestOverdue: String,

  // User invitations
  inviteNewUser: String,
  inviteNewUserEntra: String,
  notifyExistingUserWhenAttemptingToRegisterAgain: String,
  selfRegisterNewAccount: String,

  // Verification
  entraOtpEmail: String,
});

const govNotifyTemplatesSchema = new SimpleSchema({
  email: govNotifyEmailTemplatesSchema,
});

const govNotifySchema = new SimpleSchema({
  apiKey: String,
  templates: govNotifyTemplatesSchema,
});

const notificationsSchema = new SimpleSchema({
  interactionsUrl: patterns.url,
  profileUrl: patterns.url,
  servicesUrl: patterns.url,
  helpUrl: patterns.url,
  supportEmailAddress: String,
  organisations: schemas.apiClient,
  directories: schemas.apiClient,
  govNotify: govNotifySchema,
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
  useEntraForAccountRegistration: {
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
