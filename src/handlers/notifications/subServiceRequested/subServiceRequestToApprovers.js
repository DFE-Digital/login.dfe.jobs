const { directories } = require('login.dfe.dao');
const { getEmailAdapter } = require('../../../infrastructure/email');
const OrganisatonsClient = require('../../../infrastructure/organisations');
const DirectoriesClient = require('../../../infrastructure/directories');

const jobType = 'sub_service_request_to_approvers';

const execute = async (config, logger, data) => {
  try {
    const organisationsClient = new OrganisatonsClient(config.notifications.organisations);
    const directoriesClient = new DirectoriesClient(config.notifications.directories);

    const isMultipleSubServicesReq = data.requestedSubServices.length > 1;
    let subject = 'Request to change sub-service access.';

    const { envName } = config.notifications;
    if (envName !== 'pr') {
      subject = `(${envName}) ${subject}`;
    }
    const emailAdapter = getEmailAdapter(config, logger);
    const templateName = 'sub-service-request-to-approvers';

    const approversForOrg = await organisationsClient.getApproversForOrganisation(data.orgId);
    const activeApprovers = await directories.getAllActiveUsersFromList(approversForOrg);
    const activeApproverIds = activeApprovers.map((entity) => entity.sub);

    if (activeApproverIds.length > 0) {
      const approvers = await directoriesClient.getUsersByIds(activeApproverIds);

      for (let i = 0; i < approvers.length; i += 1) {
        const approverName = `${approvers[i].given_name} ${approvers[i].family_name}`;
        const approverEmail = approvers[i].email;
        const senderName = `${data.senderFirstName} ${data.senderLastName}`;

        const emailData = {
          approverName,
          senderName,
          senderEmail: data.senderEmail,
          orgName: data.orgName,
          approveUrl: data.approveUrl,
          rejectUrl: data.rejectUrl,
          helpUrl: data.helpUrl,
          serviceName: data.serviceName,
          requestedSubServices: data.requestedSubServices,
          isMultipleSubServicesReq,
        };

        emailAdapter.send(approverEmail, templateName, emailData, subject);
      }
    }
  } catch (e) {
    logger.error(`Failed to process and send the email for type ${jobType} - ${JSON.stringify(e)}`);
    throw new Error(`Failed to process and send the email for type ${jobType} - ${JSON.stringify(e)}`);
  }
};

const getHandler = (config, logger) => ({
  type: jobType,
  processor: async (data) => {
    await execute(config, logger, data);
  },
});

module.exports = {
  getHandler,
};
