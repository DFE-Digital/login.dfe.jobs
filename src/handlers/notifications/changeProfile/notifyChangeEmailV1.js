const { getEmailAdapter } = require('../../../infrastructure/email');

const process = async (config, logger, data) => {
  const email = getEmailAdapter(config, logger);
  await email.send(data.email, 'notify-change-email', {
    firstName: data.firstName,
    lastName: data.lastName,
    newEmail: data.newEmail,
    profileUrl: config.notifications.profileUrl,
    helpUrl: config.notifications.helpUrl,
  }, 'Request to change your DfE Sign-in email address');
};

const getHandler = (config, logger) => {
  return {
    type: 'notifychangeemail_v1',
    processor: async (data) => {
      await process(config, logger, data);
    }
  };
};

module.exports = {
  getHandler,
};
