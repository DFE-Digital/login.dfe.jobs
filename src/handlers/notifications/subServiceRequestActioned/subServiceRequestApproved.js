const { getNotifyAdapter } = require('../../../infrastructure/notify');

const process = async (config, logger, data) => {
  const notify = getNotifyAdapter(config);

  await notify.sendEmail('userRequestsForSubServicesApproved', data.email, {
    personalisation: {
      firstName: data.firstName,
      lastName: data.lastName,
      orgName: data.orgName,
      permissionName: (data.permission?.name ? data.permission.name : 'n/a'),
      serviceName: data.serviceName,
      requestedSubServices: data.requestedSubServices,
      signInUrl: `${config.notifications.servicesUrl}/my-services`,
      helpUrl: `${config.notifications.helpUrl}/contact-us`,
    },
  });
};

const getHandler = (config, logger) => ({
  type: 'sub_service_request_approved',
  processor: async (data) => {
    await process(config, logger, data);
  },
});

module.exports = {
  getHandler,
};
