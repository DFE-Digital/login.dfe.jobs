const { getNotifyAdapter } = require('../../../infrastructure/notify');

const process = async (config, logger, data) => {
  const notify = getNotifyAdapter(config);

  const reason = data.reason?.trim() ?? '';
  await notify.sendEmail('userRequestsForSubServicesRejected', data.email, {
    personalisation: {
      firstName: data.firstName,
      lastName: data.lastName,
      orgName: data.orgName,
      serviceName: data.serviceName,
      requestedSubServices: data.requestedSubServices,
      reason,
      showReasonHeader: reason.length > 0,
      signInUrl: `${config.notifications.servicesUrl}/my-services`,
      helpUrl: `${config.notifications.helpUrl}/contact-us`
    },
  });
};

const getHandler = (config, logger) => ({
  type: 'sub_service_request_rejected',
  processor: async (data) => {
    await process(config, logger, data);
  },
});

module.exports = {
  getHandler,
};
