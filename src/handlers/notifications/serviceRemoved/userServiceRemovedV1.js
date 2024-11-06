const { getEmailAdapter } = require('../../../infrastructure/email');

const process = async (config, logger, data) => {
  const email = getEmailAdapter(config, logger);
  await email.send(data.email, 'user-service-removed', {
    firstName: data.firstName,
    lastName: data.lastName,
    serviceName: data.serviceName,
    orgName: data.orgName,
    signInUrl: `${config.notifications.servicesUrl}`,
    helpUrl: `${config.notifications.helpUrl}/contact`,
  }, `DfE Sign-in - Your access to ${data.serviceName} for ${data.orgName} has been revoked` )
};

const getHandler = (config, logger) => {
  return {
    type: 'userserviceremoved_v1',
    processor: async (data) => {
      await process(config, logger, data);
    }
  }
};

module.exports = {
  getHandler,
};
