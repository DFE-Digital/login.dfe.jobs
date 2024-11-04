const { getEmailAdapter } = require('../../../infrastructure/email');

const process = async (config, logger, data) => {
  try {
    const email = getEmailAdapter(config, logger);
    await email.send(data.email, 'invitation', {
      firstName: data.firstName,
      lastName: data.lastName,
      serviceName: 'Key to Success',
      selfInvoked: false,
      code: data.code,
      returnUrl: `${config.notifications.migrationUrl}/${data.invitationId}`,
    }, 'You’ve been invited to join Key to Success');

  } catch (e) {
    logger.error(`Failed to process and send the email for type invitation_v1 - ${JSON.stringify(e)}`);
    throw new Error(`Failed to process and send the email for type invitation_v1 - ${JSON.stringify(e)}`);
  }
};

const getHandler = (config, logger) => {
  return {
    type: 'invitation_v1',
    processor: async (data) => {
      await process(config, logger, data);
    }
  };
};

module.exports = {
  getHandler,
};
