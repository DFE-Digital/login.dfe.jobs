const { getNotifyAdapter } = require('../../../infrastructure/notify');

const process = async (config, logger, data) => {
  const notify = getNotifyAdapter(config);

  await notify.sendEmail('supportRequestOverdue', data.email, {
    personalisation: {
      name: data.name,
      requestsCount: data.requestsCount,
      helpUrl: `${config.notifications.helpUrl}/contact`,
      servicesUrl: `${config.notifications.servicesUrl}/access-requests`,
    },
  });
};

const getHandler = (config, logger) => {
  return {
    type: 'supportoverduerequest',
    processor: async (data) => {
      await process(config, logger, data);
    }
  };
};

module.exports = {
  getHandler,
};
