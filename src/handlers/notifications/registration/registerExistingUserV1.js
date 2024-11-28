const { getNotifyAdapter } = require('../../../infrastructure/notify');

const process = async (config, logger, data) => {
  const notify = getNotifyAdapter(config);
  await notify.sendEmail('notifyExistingUserWhenAttemptingToRegisterAgain', data.email, {
    personalisation: {
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email,
      serviceName: data.serviceName || 'DfE Sign-in',
      returnUrl: data.returnUrl,
      helpUrl: `${config.notifications.helpUrl}/contact-us`,
    },
  });
};

const getHandler = (config, logger) => {
  return {
    type: 'registerexistinguser_v1',
    processor: async (data) => {
      await process(config, logger, data);
    }
  };
};

module.exports = {
  getHandler,
};
