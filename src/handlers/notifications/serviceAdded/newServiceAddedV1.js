const { getNotifyAdapter } = require("../../../infrastructure/notify");

const process = async (config, logger, data) => {
  const notify = getNotifyAdapter(config);

  await notify.sendEmail("userRequestForServiceApprovedV1", data.email, {
    personalisation: {
      firstName: data.firstName,
      lastName: data.lastName,
      signInUrl: `${config.notifications.servicesUrl}`,
      helpUrl: `${config.notifications.helpUrl}/contact-us`,
    },
  });
};

const getHandler = (config, logger) => ({
  type: "userserviceadded_v1",
  processor: async (data) => {
    await process(config, logger, data);
  },
});

module.exports = {
  getHandler,
};
