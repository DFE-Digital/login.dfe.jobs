const {getEmailAdapter} = require('../../../infrastructure/email');
const {v4: uuid} = require('uuid');

const process = async (config, logger, data) => {
  const email = getEmailAdapter(config, logger);
  await email.send(data.email, 'confirm-migrated-email', {
    code: data.code,
    clientId: data.clientId,
    email: data.email,
    returnUrl: `${config.notifications.interactionsUrl}/${uuid()}/migration/${data.uid}/confirm-email`,
  }, 'DfE Sign-in: confirm your email');
};

const getHandler = (config, logger) => {
  return {
    type: 'confirmmigratedemail_v1',
    processor: async (data) => {
      await process(config, logger, data);
    }
  };
};

module.exports = {
  getHandler,
};
