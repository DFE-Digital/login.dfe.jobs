const { getNotifyAdapter } = require("../../../infrastructure/notify");

const process = async (config, logger, data) => {
  const notify = getNotifyAdapter(config);
  const additionalInfo = data.typeAdditionalInfo?.trim() ?? "";
  const showAdditionalInfoHeader = additionalInfo.length > 0;

  await notify.sendEmail(
    "supportRequest",
    config.notifications.supportEmailAddress,
    {
      personalisation: {
        name: data.name,
        email: data.email,
        orgName: data.orgName ?? "",
        urn: data.urn ?? "",
        service: data.service,
        type: data.type,
        message: data.message,
        showAdditionalInfoHeader,
        typeAdditionalInfo: additionalInfo,
        helpUrl: `${config.notifications.helpUrl}/contact-us`,
      },
    },
  );
};

const getHandler = (config, logger) => ({
  type: "supportrequest_v1",
  processor: async (data) => {
    await process(config, logger, data);
  },
});

module.exports = {
  getHandler,
};
