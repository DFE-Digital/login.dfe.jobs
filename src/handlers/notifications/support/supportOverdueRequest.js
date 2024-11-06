const { getEmailAdapter } = require('../../../infrastructure/email');

const process = async (config, logger, data) => {
  const email = getEmailAdapter(config, logger);
const emailSubject = `Action needed: ${data.requestsCount} outstanding request${data.requestsCount === 1 ? '' : 's'} awaiting approval on DfE Sign-in`;

  await email.send(data.email, 'support-overdue-request', {
    name: data.name,
    requestsCount: data.requestsCount,
    helpUrl: `${config.notifications.helpUrl}/contact`,
    servicesUrl:`${config.notifications.servicesUrl}/access-requests`,
  }, emailSubject);
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
