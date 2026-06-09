const { getAllApplicationRequiringNotification } = require("./../utils");
const {
  getUserRaw,
  getUserServicesRaw,
  getUserOrganisationsRaw,
} = require("login.dfe.api-client/users");
const { bullEnqueue } = require("../../../infrastructure/jobQueue/BullHelpers");
const { v4: uuid } = require("uuid");

const applictionRequiringNotificationCondition = (a) =>
  a.relyingParty &&
  a.relyingParty.params &&
  a.relyingParty.params.receiveUserUpdates === "true";

const getRequiredJobs = async (config, logger, userData, correlationId) => {
  let user = userData;
  if (!user.status || !user.email) {
    user = await getUserRaw({ by: { id: user.sub } });
  }

  const jobs = [];
  const applications = await getAllApplicationRequiringNotification(
    config,
    applictionRequiringNotificationCondition,
    correlationId,
    true,
  );
  const userOrganisations = await getUserOrganisationsRaw({ userId: user.sub });
  const userAccess = await getUserServicesRaw({ userId: user.sub });

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
  if (data.removedServiceId) {
    const correlationId = `userupdated-removed-${jobId || uuid()}`;
    try {
      const allApps = await getAllApplicationRequiringNotification(
        config,
        applictionRequiringNotificationCondition,
        correlationId,
        true,
      );
      const removedId = data.removedServiceId.toLowerCase();
      const removedApp =
        allApps.find((a) => a.id.toLowerCase() === removedId) ||
        allApps.find(
          (a) =>
            a.children &&
            a.children.some((c) => c.id.toLowerCase() === removedId),
        );
      if (removedApp) {
        if (!data.removedOrgId) {
          logger.warn(
            `removedOrgId missing for user ${data.sub} when enqueuing deactivation sync for service ${removedApp.id}`,
          );
        } else {
          const user =
            data.email && data.status != null
              ? data
              : await getUserRaw({ by: { id: data.sub } });
          const userId = user.sub || data.sub;
          const userOrganisations = await getUserOrganisationsRaw({ userId });
          const organisationAccess = userOrganisations
            ? userOrganisations.find(
                (o) =>
                  o.organisation.id.toLowerCase() ===
                  data.removedOrgId.toLowerCase(),
              )
            : null;
          if (organisationAccess) {
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
            const job = {
              user: {
                userId,
                legacyUserId: organisationAccess.numericIdentifier,
                legacyUsername: organisationAccess.textIdentifier,
                firstName: user.given_name,
                lastName: user.family_name,
                email: user.email,
                status: 0,
                organisationId: organisationAccess.organisation.legacyId,
                organisationUrn: organisationAccess.organisation.urn,
                organisationUid: organisationAccess.organisation.uid,
                organisationLACode: localAuthorityCode
                  ? localAuthorityCode
                  : "",
                roles: [],
              },
              applicationId: removedApp.id,
            };
            await bullEnqueue(`sendwsuserupdated_v1_${removedApp.id}`, job);
            logger.info(
              `Enqueued deactivation sync for removed service ${removedApp.id} for user ${data.sub}`,
            );
          } else {
            logger.warn(
              `Could not find organisation ${data.removedOrgId} for user ${data.sub} when enqueuing deactivation sync for service ${removedApp.id}`,
            );
          }
        }
      } else {
        logger.warn(
          `Removed service ${data.removedServiceId} not found in applications requiring notification`,
        );
      }
    } catch (e) {
      logger.error(`Failed to enqueue deactivation sync for removed service`, {
        error: { message: e.message, stack: e.stack },
        sub: data.sub,
        removedServiceId: data.removedServiceId,
      });
    }
  }

  const correlationId = `userupdated-${jobId || uuid()}`;

  const jobs = await getRequiredJobs(config, logger, data, correlationId);

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
