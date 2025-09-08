const { getNotifyAdapter } = require("../../../infrastructure/notify");
const { directories } = require("login.dfe.dao");
const { getUsersRaw } = require("login.dfe.api-client/users");
const {
  getOrganisationApprovers,
} = require("login.dfe.api-client/organisations");

const process = async (config, logger, data) => {
  try {
    const organisationId = data.organisationId;

    const approversForOrg = await getOrganisationApprovers({
      organisationId: organisationId,
    });

    const activeApprovers =
      await directories.getAllActiveUsersFromList(approversForOrg);
    let activeApproverIds = activeApprovers.map((entity) => entity.sub);
    activeApproverIds = activeApproverIds.filter(
      (id) => id !== data.approverUserId.toUpperCase(),
    );

    const notify = getNotifyAdapter(config);
    const approvers = await getUsersRaw({
      by: { userIds: activeApproverIds },
    });
    const approverDetails = approvers.map((x) => ({
      email: x.email,
      firstName: x.given_name,
      lastName: x.family_name,
    }));

    await Promise.all(
      approverDetails.map(async (approver) => {
        console.log(approver);
        const template =
          data.approved === true
            ? "userRequestForOrganisationAccessApprovedToApprovers"
            : "userRequestForOrganisationAccessRejectedToApprovers";
        const reason =
          data.approved === true ? "" : (data.reason?.trim() ?? "");
        const showReasonHeader = reason.length > 0;

        await notify.sendEmail(template, approver.email, {
          personalisation: {
            approverFirstName: approver.firstName,
            approverLastName: approver.lastName,
            endUserName: data.endUserName,
            endUserEmail: data.endUserEmail,
            orgName: data.orgName,
            showReasonHeader,
            reason,
            helpUrl: `${config.notifications.helpUrl}/contact-us`,
          },
        });
      }),
    );
  } catch (e) {
    logger.error(e.message);
    throw e;
  }
};

const getHandler = (config, logger) => {
  return {
    type: "organisation_request_outcome_to_approvers",
    processor: async (data) => {
      await process(config, logger, data);
    },
  };
};

module.exports = {
  getHandler,
};
