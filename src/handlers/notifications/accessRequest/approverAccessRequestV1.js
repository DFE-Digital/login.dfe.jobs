const { getNotifyAdapter } = require('../../../infrastructure/notify');

const process = async (config, logger, data) => {
  const notify = await getNotifyAdapter(config);

  const emailPromises = data.recipients.map((recipient) => notify.sendEmail('approverRequestAccess', recipient, {
    personalisation: {
      orgName: data.orgName,
      name: data.userName,
      email: data.userEmail,
      returnUrl: `${config.notifications.servicesUrl}/access-requests/organisation-requests/${data.requestId}`,
      helpUrl: `${config.notifications.helpUrl}/contact-us`,
    },
  }));
  await Promise.all(emailPromises);
};

const getHandler = (config, logger) => ({
  type: 'approveraccessrequest_v1',
  processor: async (data) => {
    await process(config, logger, data);
  },
});

module.exports = {
  getHandler,
};
