const { getAllApplicationRequiringNotification, enqueue } = require('./../utils');
const AccessClient = require('../../../infrastructure/access');
const OrganisatonsClient = require('../../../infrastructure/organisations');
const DirectoriesClient = require('../../../infrastructure/directories');
const kue = require('login.dfe.kue');
const { v4:uuid } = require('uuid');

const applictionRequiringNotificationCondition = (a) => a.relyingParty && a.relyingParty.params && a.relyingParty.params.receiveUserUpdates === 'true';

const getRequiredJobs = async (config, logger, userData, correlationId) => {
  const accessClient = new AccessClient(config.serviceNotifications.access, correlationId);
  const organisationsClient = new OrganisatonsClient(config.serviceNotifications.organisations, correlationId);

  let user = userData;
  if (!user.status || !user.email) {
    const directoriesClient = new DirectoriesClient(config.serviceNotifications.directories, correlationId);
    user = await directoriesClient.getUser(user.sub);
  }

  const jobs = [];
  const applications = await getAllApplicationRequiringNotification(config, applictionRequiringNotificationCondition, correlationId, true);
  const userOrganisations = await organisationsClient.listUserOrganisations(user.sub);
  const userAccess = await accessClient.listUserAccess(user.sub);

  applications.forEach((application) => {
    const userAccessToApplication = userAccess ? userAccess.filter(x => x.serviceId.toLowerCase() === application.id.toLowerCase()) : [];
    if (application.children) {
      application.children.forEach((childApplication) => {
        const userAccessToChildApplication = userAccess ? userAccess.filter(x => x.serviceId.toLowerCase() === childApplication.id.toLowerCase()) : [];
        userAccessToChildApplication.forEach((applicationAccess) => {
          let applicationAccessForSameOrg = userAccessToApplication.find(x => x.organisationId.toLowerCase() === applicationAccess.organisationId.toLowerCase());
          if (!applicationAccessForSameOrg) {
            applicationAccessForSameOrg = Object.assign({}, applicationAccess, { roles: [] });
            userAccessToApplication.push(applicationAccessForSameOrg);
          }
          applicationAccessForSameOrg.roles.push(...applicationAccess.roles);
        })
      });
    }
    userAccessToApplication.forEach((applicationAccess) => {
      const organisationAccess = userOrganisations.find(o => o.organisation.id.toLowerCase() === applicationAccess.organisationId.toLowerCase());
      if (!organisationAccess) {
        logger.warn(`User ${user.sub} appears to have access to ${applicationAccess.serviceId} for organisation ${applicationAccess.organisationId}; however could not find access to org`, { correlationId });
        return;
      }

      let localAuthorityCode;

      if (organisationAccess.organisation.category && organisationAccess.organisation.category.id === '002') {
        localAuthorityCode = organisationAccess.organisation.establishmentNumber;
      } else if (organisationAccess.organisation.localAuthority) {
        localAuthorityCode = organisationAccess.organisation.localAuthority.code;
      }

      jobs.push({
        user: {
          userId: user.sub,
          legacyUserId: organisationAccess.numericIdentifier,
          legacyUsername: organisationAccess.textIdentifier,
          firstName: user.given_name,
          lastName: user.family_name,
          email: user.email,
          status: user.status,
          organisationId: organisationAccess.organisation.legacyId,
          organisationUrn: organisationAccess.organisation.urn,
          organisationUid: organisationAccess.organisation.uid,
          organisationLACode: localAuthorityCode ? localAuthorityCode : '',
          roles: applicationAccess.roles.map((role) => ({
            id: role.numericId,
            code: role.code,
          })),
        },
        applicationId: application.id,
      });
    })
  });

  return jobs;
};

const process = async (config, logger, data, jobId) => {
  const correlationId = `userupdated-${jobId || uuid()}`;

  const jobs = await getRequiredJobs(config, logger, data, correlationId);

  const queue = kue.createQueue({
    redis: config.queueStorage.connectionString,
  });
  for (let i = 0; i < jobs.length; i += 1) {
    await enqueue(queue, `sendwsuserupdated_v1_${jobs[i].applicationId}`, jobs[i]);
  }
};

const getHandler = (config, logger) => {
  return {
    type: 'userupdated_v1',
    processor: async (data, jobId) => {
      await process(config, logger, data, jobId);
    }
  };
};

module.exports = {
  getHandler,
};
