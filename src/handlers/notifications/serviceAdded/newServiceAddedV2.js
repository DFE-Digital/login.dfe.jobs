const { getNotifyAdapter } = require('../../../infrastructure/notify');

const process = async (config, logger, data) => {
  const notify = getNotifyAdapter(config);

  await notify.sendEmail('userRequestForServiceApprovedV2', data.email, {
    personalisation: {
      firstName: data.firstName,
      lastName: data.lastName,
      orgName: data.orgName,
      permissionName: (data.permission?.name ? data.permission.name : 'n/a'),
      serviceName: data.serviceName,
      subServices: data.requestedSubServices,
      isApprover: data.permission?.id === 10000,
      signInUrl: `${config.notifications.servicesUrl}/my-services`,
      helpUrl: `${config.notifications.helpUrl}/contact`,
    },
  });
};

const getHandler = (config, logger) => ({
  type: 'userserviceadded_v2',
  processor: async (data) => {
    await process(config, logger, data);
  },
});

module.exports = {
  getHandler,
};
