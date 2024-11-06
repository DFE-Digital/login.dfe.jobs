const { getEmailAdapter } = require('../../../infrastructure/email');

const process = async (config, logger, data) => {
  const email = getEmailAdapter(config, logger);
  await email.send(data.email, 'user-persmission-level-changed', {
    firstName: data.firstName,
    lastName: data.lastName,
    orgName: data.orgName,
    permission: data.permission,
    signInUrl: `${config.notifications.servicesUrl}`,
    helpUrl: `${config.notifications.helpUrl}/contact`,
    contactUsUrl: `${config.notifications.helpUrl}/contact-us`,
    helpApproverUrl: `${config.notifications.helpUrl}/approvers`,
  }, `Your DfE Sign-in permission level has changed for ${data.orgName}`);
};

const getHandler = (config, logger) => ({
  type: 'changeuserpermissionlevelrequest_v1',
  processor: async (data) => {
    await process(config, logger, data);
  },
});

module.exports = {
  getHandler,
};
