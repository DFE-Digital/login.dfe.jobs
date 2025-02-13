const { getNotifyAdapter } = require("../../../infrastructure/notify");

const process = async (config, logger, data) => {
  const notify = getNotifyAdapter(config);
  const template =
    data.approved === true
      ? "userRequestForOrganisationAccessApproved"
      : "userRequestForOrganisationAccessRejected";
  const reason = data.approved === true ? "" : (data.reason?.trim() ?? "");
  const showReasonHeader = reason.length > 0;

  await notify.sendEmail(template, data.email, {
    personalisation: {
      orgName: data.orgName,
      name: data.name,
      showReasonHeader,
      reason,
      servicesUrl: config.notifications.servicesUrl,
      helpUrl: `${config.notifications.helpUrl}/contact-us`,
    },
  });
};

const getHandler = (config, logger) => {
  return {
    type: "accessrequest_v1",
    processor: async (data) => {
      await process(config, logger, data);
    },
  };
};

module.exports = {
  getHandler,
};
