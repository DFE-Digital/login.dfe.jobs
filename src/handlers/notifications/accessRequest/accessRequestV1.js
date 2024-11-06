const { getEmailAdapter } = require('../../../infrastructure/email');

const process = async (config, logger, data) => {
  const email = getEmailAdapter(config, logger);
  await email.send(data.email, 'access-request-email', {
    orgName: data.orgName,
    name: data.name,
    approved: data.approved,
    reason: data.reason,
    helpUrl: `${config.notifications.helpUrl}/contact`,
    servicesUrl:`${config.notifications.servicesUrl}`,
  }, `DfE Sign-in - Request to access ${data.orgName}`);
};

const getHandler = (config, logger) => {
  return {
    type: 'accessrequest_v1',
    processor: async (data) => {
      await process(config, logger, data);
    }
  };
};

module.exports = {
  getHandler,
};
