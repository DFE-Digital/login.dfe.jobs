const { getEmailAdapter } = require('../../../infrastructure/email');

const process = async (config, logger, data) => {
  const email = getEmailAdapter(config, logger);
  await email.send(data.email, 'user-service-added', {
    firstName: data.firstName,
    lastName: data.lastName,
    signInUrl: `${config.notifications.servicesUrl}`,
    helpUrl: `${config.notifications.helpUrl}/contact`,
  }, `DfE Sign-in - Access to new services granted` )
};

const getHandler = (config, logger) => {
  return {
    type: 'userserviceadded_v1',
    processor: async (data) => {
      await process(config, logger, data);
    }
  }
};

module.exports = {
  getHandler,
};
