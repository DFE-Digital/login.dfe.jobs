const { getEmailAdapter } = require('../../../infrastructure/email');

const process = async (config, logger, data) => {
  const email = getEmailAdapter(config, logger);
  await email.send(data.email, 'user-service-rejected', {
    firstName: data.firstName,
    lastName: data.lastName,
    orgName: data.orgName,
    serviceName: data.serviceName,
    requestedSubServices: data.requestedSubServices,
    reason: data.reason,
    signInUrl: `${config.notifications.servicesUrl}/my-services`
  }, `Service request rejected` )
};

const getHandler = (config, logger) => {
  return {
    type: 'userservicerejected_v1',
    processor: async (data) => {
      await process(config, logger, data);
    }
  }
};

module.exports = {
  getHandler,
};
