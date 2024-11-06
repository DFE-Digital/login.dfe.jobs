const {getEmailAdapter} = require('../../../infrastructure/email');
const {v4: uuid} = require('uuid');

const process = async (config, logger, data) => {
  try {
    const email = getEmailAdapter(config, logger);
    await email.send(data.email, 'password-reset', {
      firstName: data.firstName,
      lastName: data.lastName,
      code: data.code,
      clientId: data.clientId,
      returnUrl: `${config.notifications.interactionsUrl}/${uuid()}/resetpassword/${data.uid}/confirm?clientid=${data.clientId}`,
      helpUrl: `${config.notifications.helpUrl}/contact-us`,
    }, 'DfE Sign-in: reset your password');
  } catch (e) {
    logger.error(`Failed to process and send the email for type passwordreset_v1 - ${JSON.stringify(e)}`);
    throw new Error(`Failed to process and send the email for type passwordreset_v1 - ${JSON.stringify(e)}`);
  }
};

const getHandler = (config, logger) => {
  return {
    type: 'passwordreset_v1',
    processor: async (data) => {
      await process(config, logger, data);
    }
  };
};

module.exports = {
  getHandler,
};
