const { getEmailAdapter } = require('../../../infrastructure/email');

const process = async (config, logger, data) => {
  const email = getEmailAdapter(config, logger);
  await email.send(config.notifications.supportEmailAddress, 'support-request', {
    name: data.name,
    email: data.email,
    orgName: data.orgName ? data.orgName : null,
    urn: data.urn ? data.urn : null,
    message: data.message,
    service: data.service,
    type: data.type,
    typeAdditionalInfo: data.typeAdditionalInfo,
  }, 'DfE Sign-in service desk request');
};

const getHandler = (config, logger) => {
  return {
    type: 'supportrequest_v1',
    processor: async (data) => {
      await process(config, logger, data);
    },
  };
};

module.exports = {
  getHandler,
};
