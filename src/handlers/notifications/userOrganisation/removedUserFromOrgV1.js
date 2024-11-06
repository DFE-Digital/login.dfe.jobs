const { getEmailAdapter } = require('../../../infrastructure/email');

const process = async (config, logger, data) => {
  const email = getEmailAdapter(config, logger);
  await email.send(data.email, 'user-removed-from-organisation', {
    firstName: data.firstName,
    lastName: data.lastName,
    orgName: data.orgName,
    signInUrl: `${config.notifications.servicesUrl}`,
    helpUrl: `${config.notifications.helpUrl}/contact`,
  }, `DfE Sign-in - Your access to ${data.orgName} has been revoked`)
};

const getHandler = (config, logger) => {
  return {
    type: 'userremovedfromorganisationrequest_v1',
    processor: async (data) => {
      await process(config, logger, data);
    }
  }
};

module.exports = {
  getHandler,
};
