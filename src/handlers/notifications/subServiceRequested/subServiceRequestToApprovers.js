const { directories } = require("login.dfe.dao");
const { getNotifyAdapter } = require("../../../infrastructure/notify");
const OrganisatonsClient = require("../../../infrastructure/organisations");
const DirectoriesClient = require("../../../infrastructure/directories");

const execute = async (config, logger, data) => {
  const organisationsClient = new OrganisatonsClient(
    config.notifications.organisations,
  );
  const directoriesClient = new DirectoriesClient(
    config.notifications.directories,
  );

  const approversForOrg = await organisationsClient.getApproversForOrganisation(
    data.orgId,
  );
  const activeApprovers =
    await directories.getAllActiveUsersFromList(approversForOrg);
  const activeApproverIds = activeApprovers.map((entity) => entity.sub);

  if (activeApproverIds.length === 0) {
    return;
  }

  const notify = getNotifyAdapter(config);
  const approvers = await directoriesClient.getUsersByIds(activeApproverIds);
  const senderName = `${data.senderFirstName} ${data.senderLastName}`;

  for (let approver of approvers) {
    await notify.sendEmail(
      "userRequestToApproverForSubServiceAccess",
      approver.email,
      {
        personalisation: {
          firstName: approver.given_name,
          lastName: approver.family_name,
          senderName,
          orgName: data.orgName,
          approveUrl: data.approveUrl,
          serviceName: data.serviceName,
          rejectUrl: data.rejectUrl,
          requestedSubServices:
            data.requestedSubServices?.length > 0
              ? data.requestedSubServices
              : ["No roles selected."],
          helpUrl: data.helpUrl,
          contactUsUrl: `${config.notifications.helpUrl}/contact-us`,
        },
      },
    );
  }
};

const getHandler = (config, logger) => ({
  type: "sub_service_request_to_approvers",
  processor: async (data) => {
    await execute(config, logger, data);
  },
});

module.exports = {
  getHandler,
};
