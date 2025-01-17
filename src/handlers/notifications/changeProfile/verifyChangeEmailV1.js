const { getNotifyAdapter } = require("../../../infrastructure/notify");

const process = async (config, logger, data) => {
  const notify = getNotifyAdapter(config);
  await notify.sendEmail("verifyChangeEmailAddress", data.email, {
    personalisation: {
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email,
      code: data.code,
      returnUrl: data.uid
        ? `${config.notifications.profileUrl}/change-email/${data.uid}/verify`
        : `${config.notifications.profileUrl}/change-email/verify`,
      helpUrl: config.notifications.helpUrl,
    },
  });
};

const getHandler = (config, logger) => {
  return {
    type: "verifychangeemail_v1",
    processor: async (data) => {
      await process(config, logger, data);
    },
  };
};

module.exports = {
  getHandler,
};
