const { directories } = require('login.dfe.dao');
const { getEmailAdapter } = require('../../../infrastructure/email');
const OrganisatonsClient = require('../../../infrastructure/organisations');
const DirectoriesClient = require('../../../infrastructure/directories');

const execute = async (config, logger, data) => {
  try {
    const organisationsClient = new OrganisatonsClient(config.notifications.organisations)
    const directoriesClient = new DirectoriesClient(config.notifications.directories)
    let subject = 'A user has requested access to a service'
    const envName = config.notifications.envName
    if(envName !== 'pr') {
      subject = `(${envName}) ${subject}`
    }
    const email = getEmailAdapter(config, logger);

    const approversForOrg = await organisationsClient.getApproversForOrganisation(data.orgId);
    const activeApprovers = await directories.getAllActiveUsersFromList(approversForOrg);
    const activeApproverIds = activeApprovers.map((entity) => entity.sub);

    if (activeApproverIds.length > 0) {
      const approvers = await directoriesClient.getUsersByIds(activeApproverIds);

      for (let i=0; i < approvers.length; i++) {
        const name = `${approvers[i].given_name} ${approvers[i].family_name}`;
        const approverEmail = approvers[i].email;

        await email.send(approverEmail, 'service-request-to-approvers', {
          approverName: name,
          senderName: data.senderName,
          senderEmail: data.senderEmail,
          orgName: data.orgName,
          approveServiceUrl: data.approveServiceUrl,
          rejectServiceUrl: data.rejectServiceUrl,
          helpUrl: data.helpUrl,
          requestedServiceName: data.requestedServiceName,
          requestedSubServices: data.requestedSubServices
        }, subject )
      }
    }
  } catch (e) {
    logger.error(`Failed to process and send the email for type servicerequest_to_approvers_v2 - ${JSON.stringify(e)}`);
    throw new Error(`Failed to process and send the email for type servicerequest_to_approvers_v2 - ${JSON.stringify(e)}`);
  }
};

const getHandler = (config, logger) => {
  return {
    type: 'servicerequest_to_approvers_v2',
    processor: async (data) => {
      await execute(config, logger, data);
    },
  };
};

module.exports = {
  getHandler,
};
