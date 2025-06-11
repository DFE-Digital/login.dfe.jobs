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
        service: data.service ?? "",
        type: data.type,
        message: data.message,
        showAdditionalInfoHeader,
        typeAdditionalInfo: additionalInfo,
        helpUrl: `${config.notifications.helpUrl}/contact-us`,
      },
    },
  );
};

// DSI-7757 requires that supportrequest_v1 has a limiter policy so-as to
// not trigger ServiceNow's 'flood detection filter threshold' which is
// set at 50 emails per 5 minute timeframe.  The request is that we
// send 10% fewer (45) messages within the specified timeframe (300000)
const getHandler = (config, logger) => ({
  type: "supportrequest_v1",
  limiter: {
    max: 45,
    duration: 300000,
  },
  processor: async (data) => {
    await process(config, logger, data);
  },
});

module.exports = {
  getHandler,
};
