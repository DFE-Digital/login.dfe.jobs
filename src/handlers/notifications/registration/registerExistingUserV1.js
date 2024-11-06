const { getEmailAdapter } = require('../../../infrastructure/email');

const process = async (config, logger, data) => {
  try {
    const serviceName = data.serviceName || 'DfE Sign-in';

    const email = getEmailAdapter(config, logger);
    await email.send(data.email, 'registerexistinguser', {
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email,
      serviceName,
      returnUrl: data.returnUrl,
    }, `You’ve registered to join ${serviceName}`);
  } catch (e) {
    logger.error(`Failed to process and send the email for type registerexistinguser_v1 - ${JSON.stringify(e)}`);
    throw new Error(`Failed to process and send the email for type registerexistinguser_v1 - ${JSON.stringify(e)}`);
  }
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
