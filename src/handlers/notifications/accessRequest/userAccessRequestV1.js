const { getEmailAdapter } = require('../../../infrastructure/email');

const process = async (config, logger, data) => {
  const email = getEmailAdapter(config, logger);
  await email.send(data.email, 'user-access-request-email', {
    orgName: data.orgName,
    name: data.name,
    helpUrl: `${config.notifications.helpUrl}/contact`,
  }, `DfE Sign-in - Request to access ${data.orgName}`);
};

const getHandler = (config, logger) => {
  return {
    type: 'useraccessrequest_v1',
    processor: async (data) => {
      await process(config, logger, data);
    }
  };
};

module.exports = {
  getHandler,
};
