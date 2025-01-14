const { getNotifyAdapter } = require("../../../infrastructure/notify");

const process = async (config, logger, data) => {
  const notify = getNotifyAdapter(config);
  await notify.sendEmail("notifyChangeEmailAddress", data.email, {
    personalisation: {
      firstName: data.firstName,
      lastName: data.lastName,
      newEmail: data.newEmail,
      profileUrl: config.notifications.profileUrl,
      helpUrl: config.notifications.helpUrl,
    },
  });
};

const getHandler = (config, logger) => {
  return {
    type: "notifychangeemail_v1",
    processor: async (data) => {
      await process(config, logger, data);
    },
  };
};

module.exports = {
  getHandler,
};
