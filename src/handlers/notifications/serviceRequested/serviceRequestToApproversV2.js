const { directories } = require("login.dfe.dao");
const { getNotifyAdapter } = require("../../../infrastructure/notify");
const { getUsersRaw } = require("login.dfe.api-client/users");

const {
  getOrganisationApprovers,
} = require("login.dfe.api-client/organisations");

const execute = async (config, logger, data) => {
  const notify = getNotifyAdapter(config);

  const approversForOrg = await getOrganisationApprovers({
    organisationId: data.orgId,
  });

  const activeApprovers =
    await directories.getAllActiveUsersFromList(approversForOrg);

  if (activeApprovers.length === 0) {
    return;
  }

  const activeApproverIds = activeApprovers.map((entity) => entity.sub);
  const approvers = await getUsersRaw({
    by: { userIds: activeApproverIds },
  });
  for (let approver of approvers) {
    await notify.sendEmail(
      "userRequestToApproverForServiceAccess",
      approver.email,
      {
        personalisation: {
          firstName: approver.given_name,
          lastName: approver.family_name,
          orgName: data.orgName,
          senderName: data.senderName,
          senderEmail: data.senderEmail,
          requestedServiceName: data.requestedServiceName,
          requestedSubServices:
            data.requestedSubServices?.length > 0
              ? data.requestedSubServices
              : ["No roles selected."],
          approveServiceUrl: data.approveServiceUrl,
          rejectServiceUrl: data.rejectServiceUrl,
          helpUrl: data.helpUrl,
        },
      },
    );
  }
};

const getHandler = (config, logger) => {
  return {
    type: "servicerequest_to_approvers_v2",
    processor: async (data) => {
      await execute(config, logger, data);
    },
  };
};

module.exports = {
  getHandler,
};
