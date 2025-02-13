const { directories } = require("login.dfe.dao");
const OrganisatonsClient = require("../../../infrastructure/organisations");
const DirectoriesClient = require("../../../infrastructure/directories");
const { bullEnqueue } = require("../../../infrastructure/jobQueue/BullHelpers");

const process = async (config, logger, data) => {
  try {
    const organisationsClient = new OrganisatonsClient(
      config.notifications.organisations,
    );
    const directoriesClient = new DirectoriesClient(
      config.notifications.directories,
    );

    const { requestId } = data;
    const request = await organisationsClient.getOrgRequestById(requestId);

    const approversForOrg =
      await organisationsClient.getApproversForOrganisation(request.org_id);
    const activeApprovers =
      await directories.getAllActiveUsersFromList(approversForOrg);
    const activeApproverIds = activeApprovers.map((entity) => entity.sub);

    const organisation = await organisationsClient.getOrganisationById(
      request.org_id,
    );
    const user = await directoriesClient.getById(request.user_id);

    if (activeApproverIds.length > 0) {
      const approvers =
        await directoriesClient.getUsersByIds(activeApproverIds);
      const approverEmails = approvers.map((x) => x.email);

      await bullEnqueue("approveraccessrequest_v1", {
        recipients: approverEmails,
        orgName: organisation.name,
        userName: `${user.given_name} ${user.family_name}`,
        userEmail: user.email,
        orgId: request.org_id,
        requestId: data.requestId,
      });
    } else {
      await bullEnqueue("supportrequest_v1", {
        name: `${user.given_name} ${user.family_name}`,
        email: user.email,
        orgName: organisation.name,
        urn: organisation.urn || "",
        message: `Organisation request for ${organisation.name}, no approvers exist. Request reason: ${request.reason}`,
        type: "Access to an organisation",
      });
    }
  } catch (e) {
    console.log(e.message);
    throw e;
  }
};

const getHandler = (config, logger) => {
  return {
    type: "organisationrequest_v1",
    processor: async (data) => {
      await process(config, logger, data);
    },
  };
};

module.exports = {
  getHandler,
};
