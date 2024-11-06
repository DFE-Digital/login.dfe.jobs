const { getEmailAdapter } = require('../../../infrastructure/email');

const process = async (config, logger, data) => {
  const email = getEmailAdapter(config, logger);
  await email.send(data.email, 'user-added-to-organisation', {
    firstName: data.firstName,
    lastName: data.lastName,
    orgName: data.orgName,
    signInUrl: `${config.notifications.servicesUrl}`,
    helpUrl: `${config.notifications.helpUrl}/contact`,
  }, `DfE Sign-in - You can now access ${data.orgName} through your DfE Sign-in account`)
};

const getHandler = (config, logger) => {
  return {
    type: 'useraddedtoorganisationrequest_v1',
    processor: async (data) => {
      await process(config, logger, data);
    }
  }
};

module.exports = {
  getHandler,
};
