const { getAllApplicationRequiringNotification } = require("./../utils");
const {
  getUserRaw,
  getUserServicesRaw,
  getUserOrganisationsRaw,
} = require("login.dfe.api-client/users");
const { bullEnqueue } = require("../../../infrastructure/jobQueue/BullHelpers");
const { v4: uuid } = require("uuid");
const { canReceiveUserUpdate } = require("./userUpdateEligibility");

const applictionRequiringNotificationCondition = (a) => canReceiveUserUpdate(a);

const getRequiredJobs = async (config, logger, userData, correlationId) => {
  let user = userData;
  if (!user.status || !user.email) {
    user = await getUserRaw({ by: { id: user.sub } });
  }

  const jobs = [];
  const candidateApplications = await getAllApplicationRequiringNotification(
    config,
    applictionRequiringNotificationCondition,
    correlationId,
    true,
  );
  const applications = candidateApplications;

  // Prefer access info captured by the upstream notification (e.g. Directories
  // snapshots services/organisations BEFORE deactivating the user, so a live
  // lookup here would return empty). Fall back to live lookups when the
  // payload does not carry them, to preserve backwards compatibility.
  const hasEmbeddedAccess =
    Array.isArray(userData?.userServices) ||
    Array.isArray(userData?.userOrganisations);

  if (hasEmbeddedAccess) {
    logger.info(
      `Using user access snapshot embedded in userupdated_v1 payload for user ${user.sub}`,
      { correlationId },
    );
    logger.info(
      `Snapshot for user ${user.sub}: ${JSON.stringify({
        userServices: userData.userServices,
        userOrganisations: userData.userOrganisations,
      })}`,
      { correlationId },
    );
  }

  logger.info(
    `Applications considered for notification: ${JSON.stringify(
      applications.map((a) => ({
        id: a.id,
        name: a.name,
        receiveUserUpdates: a.receiveUserUpdates,
      })),
    )} for user ${user.sub}`,
    { correlationId },
  );

  const userOrganisations = Array.isArray(userData?.userOrganisations)
    ? userData.userOrganisations
    : await getUserOrganisationsRaw({ userId: user.sub });
  const userAccess = Array.isArray(userData?.userServices)
    ? userData.userServices
    : await getUserServicesRaw({ userId: user.sub });

  applications.forEach((application) => {
    const userAccessToApplication = userAccess
      ? userAccess.filter(
          (x) => x.serviceId.toLowerCase() === application.id.toLowerCase(),
        )
      : [];
    if (application.children) {
      application.children.forEach((childApplication) => {
        const userAccessToChildApplication = userAccess
          ? userAccess.filter(
              (x) =>
                x.serviceId.toLowerCase() === childApplication.id.toLowerCase(),
            )
          : [];
        userAccessToChildApplication.forEach((applicationAccess) => {
          let applicationAccessForSameOrg = userAccessToApplication.find(
            (x) =>
              x.organisationId.toLowerCase() ===
              applicationAccess.organisationId.toLowerCase(),
          );
          if (!applicationAccessForSameOrg) {
            applicationAccessForSameOrg = Object.assign({}, applicationAccess, {
              roles: [],
            });
            userAccessToApplication.push(applicationAccessForSameOrg);
          }
          applicationAccessForSameOrg.roles.push(...applicationAccess.roles);
        });
      });
    }
    userAccessToApplication.forEach((applicationAccess) => {
      const organisationAccess = userOrganisations.find(
        (o) =>
          o.organisation.id.toLowerCase() ===
          applicationAccess.organisationId.toLowerCase(),
      );
      if (!organisationAccess) {
        logger.warn(
          `User ${user.sub} appears to have access to ${applicationAccess.serviceId} for organisation ${applicationAccess.organisationId}; however could not find access to org`,
          { correlationId },
        );
        return;
      }

      let localAuthorityCode;

      if (
        organisationAccess.organisation.category &&
        organisationAccess.organisation.category.id === "002"
      ) {
        localAuthorityCode =
          organisationAccess.organisation.establishmentNumber;
      } else if (organisationAccess.organisation.localAuthority) {
        localAuthorityCode =
          organisationAccess.organisation.localAuthority.code;
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
          organisationLACode: localAuthorityCode ? localAuthorityCode : "",
          roles: applicationAccess.roles.map((role) => ({
            id: role.numericId,
            code: role.code,
          })),
        },
        applicationId: application.id,
      });
    });
  });

  return jobs;
};

const process = async (config, logger, data, jobId) => {
  const correlationId = `userupdated-${jobId || uuid()}`;

  const jobs = await getRequiredJobs(config, logger, data, correlationId);
  if (jobs.length === 0) {
    logger.info(
      `No eligible user update targets found for user ${data.sub || "unknown"}`,
      { correlationId },
    );
    return;
  }

  for (let i = 0; i < jobs.length; i += 1) {
    await bullEnqueue(`sendwsuserupdated_v1_${jobs[i].applicationId}`, jobs[i]);
  }
};

const getHandler = (config, logger) => {
  return {
    type: "userupdated_v1",
    processor: async (data, jobId) => {
      await process(config, logger, data, jobId);
    },
  };
};

module.exports = {
  getHandler,
};
