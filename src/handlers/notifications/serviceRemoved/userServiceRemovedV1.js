const { getNotifyAdapter } = require("../../../infrastructure/notify");
const { bullEnqueue } = require("../../../infrastructure/jobQueue/BullHelpers");
const { getUserRaw } = require("login.dfe.api-client/users");

const process = async (config, logger, data) => {
  const notify = getNotifyAdapter(config);

  await notify.sendEmail("userServiceRemoved", data.email, {
    personalisation: {
      firstName: data.firstName,
      lastName: data.lastName,
      serviceName: data.serviceName,
      orgName: data.orgName,
      signInUrl: `${config.notifications.servicesUrl}`,
      helpUrl: `${config.notifications.helpUrl}/contact-us`,
    },
  });

  try {
    const user = await getUserRaw({ by: { email: data.email } });
    if (user?.sub) {
      await bullEnqueue("userupdated_v1", { sub: user.sub });
    } else {
      logger?.warn(
        "Could not resolve user by email for update notification",
        {
          email: data.email,
        },
      );
    }
  } catch (e) {
    logger?.error("Failed to enqueue userupdated_v1 after service removal", {
      error: { message: e.message, stack: e.stack },
    });
  }
};

const getHandler = (config, logger) => ({
  type: "userserviceremoved_v1",
  processor: async (data) => {
    await process(config, logger, data);
  },
});

module.exports = {
  getHandler,
};
