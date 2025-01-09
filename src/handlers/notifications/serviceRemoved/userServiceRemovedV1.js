const { getNotifyAdapter } = require('../../../infrastructure/notify');

const process = async (config, logger, data) => {
  const notify = getNotifyAdapter(config);

  await notify.sendEmail('userServiceRemoved', data.email, {
    personalisation: {
      firstName: data.firstName,
      lastName: data.lastName,
      serviceName: data.serviceName,
      orgName: data.orgName,
      signInUrl: `${config.notifications.servicesUrl}`,
      helpUrl: `${config.notifications.helpUrl}/contact`,
    },
  });
};

const getHandler = (config, logger) => ({
  type: 'userserviceremoved_v1',
  processor: async (data) => {
    await process(config, logger, data);
  },
});

module.exports = {
  getHandler,
};
