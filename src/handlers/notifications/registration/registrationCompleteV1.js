const {getEmailAdapter} = require('../../../infrastructure/email');

const process = async (config, logger, data) => {
  const email = getEmailAdapter(config, logger);
  await email.send(data.email, 'registrationcomplete', {
    firstName: data.firstName,
    lastName: data.lastName,
    email: data.email,
    profileUrl: config.notifications.profileUrl,
  }, 'Your new DfE Sign-in account is ready');
};

const getHandler = (config, logger) => {
  return {
    type: 'registrationcomplete_v1',
    processor: async (data) => {
      await process(config, logger, data);
    }
  };
};

module.exports = {
  getHandler,
};
