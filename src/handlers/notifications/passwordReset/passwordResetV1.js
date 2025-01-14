const { getNotifyAdapter } = require("../../../infrastructure/notify");
const { v4: uuid } = require("uuid");

const process = async (config, logger, data) => {
  const notify = getNotifyAdapter(config);
  await notify.sendEmail("verifyPasswordResetRequest", data.email, {
    personalisation: {
      firstName: data.firstName,
      lastName: data.lastName,
      code: data.code,
      returnUrl: `${config.notifications.interactionsUrl}/${uuid()}/resetpassword/${data.uid}/confirm?clientid=${data.clientId}`,
      helpUrl: `${config.notifications.helpUrl}/contact-us`,
    },
  });
};

const getHandler = (config, logger) => {
  return {
    type: "passwordreset_v1",
    processor: async (data) => {
      await process(config, logger, data);
    },
  };
};

module.exports = {
  getHandler,
};
