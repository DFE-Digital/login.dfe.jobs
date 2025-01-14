const { getNotifyAdapter } = require("../../../infrastructure/notify");

const process = async (config, logger, data) => {
  const notify = getNotifyAdapter(config);
  const oldPermissionLowercase = data.permission.oldName.toLowerCase();
  const permissionLowercase = data.permission.name.toLowerCase();
  const isNowApprover = data.permission.id === 10000;
  const isReduced = !isNowApprover;

  await notify.sendEmail("userPermissionLevelChanged", data.email, {
    personalisation: {
      firstName: data.firstName,
      lastName: data.lastName,
      orgName: data.orgName,
      oldPermissionLowercase,
      permissionLowercase,
      isNowApprover,
      isReduced,
      contactUsUrl: `${config.notifications.helpUrl}/contact-us`,
      permissionName: data.permission.name,
      signInUrl: config.notifications.servicesUrl,
      helpUrl: `${config.notifications.helpUrl}/contact-us`,
      helpApproverUrl: `${config.notifications.helpUrl}/approvers`,
    },
  });
};

const getHandler = (config, logger) => ({
  type: "changeuserpermissionlevelrequest_v1",
  processor: async (data) => {
    await process(config, logger, data);
  },
});

module.exports = {
  getHandler,
};
