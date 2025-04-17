const { getNotifyAdapter } = require("../../../infrastructure/notify");

const process = async (config, logger, data) => {
  const notify = getNotifyAdapter(config);

  for (let approverDetails of data.recipients) {
    await notify.sendEmail("approverRequestAccess", approverDetails.email, {
      personalisation: {
        approverFirstName: approverDetails.firstName,
        approverLastName: approverDetails.lastName,
        orgName: data.orgName,
        name: data.userName,
        email: data.userEmail,
        returnUrl: `${config.notifications.servicesUrl}/access-requests/organisation-requests/${data.requestId}`,
        helpUrl: `${config.notifications.helpUrl}`,
      },
    });
  }
};

const getHandler = (config, logger) => ({
  type: "approveraccessrequest_v1",
  processor: async (data) => {
    await process(config, logger, data);
  },
});

module.exports = {
  getHandler,
};
