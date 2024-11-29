const { getNotifyAdapter } = require('../../../infrastructure/notify');

const process = async (config, logger, data) => {
  const notify = getNotifyAdapter(config);
  const reason = data.reason?.trim() ?? '';
  const showReasonHeader = reason.length > 0;
  await notify.sendEmail('userRequestForServiceRejected', data.email, {
    personalisation: {
      firstName: data.firstName,
      lastName: data.lastName,
      orgName: data.orgName,
      serviceName: data.serviceName,
      requestedSubServices: data.requestedSubServices,
      reason,
      showReasonHeader,
      signInUrl: `${config.notifications.servicesUrl}/my-services`,
      helpUrl: `${config.notifications.helpUrl}/contact-us`,
    },
  });
};

const getHandler = (config, logger) => {
  return {
    type: 'userservicerejected_v1',
    processor: async (data) => {
      await process(config, logger, data);
    }
  }
};

module.exports = {
  getHandler,
};
