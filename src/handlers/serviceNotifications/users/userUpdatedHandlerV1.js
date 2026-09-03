const { getAllApplicationRequiringNotification } = require("./../utils");
const {
  getUserRaw,
  getUserServicesRaw,
  getUserOrganisationsRaw,
  searchUserByIdRaw,
  updateUserDetailsInSearchIndex,
} = require("login.dfe.api-client/users");
const { bullEnqueue } = require("../../../infrastructure/jobQueue/BullHelpers");
const { v4: uuid } = require("uuid");

const applictionRequiringNotificationCondition = (a) =>
  a.relyingParty &&
  a.relyingParty.params &&
  a.relyingParty.params.receiveUserUpdates === "true";

const syncEmailToSearchIndex = async (data, correlationId, logger) => {
  try {
    const resolvedUser = data.email
      ? data
      : await getUserRaw({ by: { id: data.sub } });
    const currentEmail = resolvedUser && resolvedUser.email;
    if (!currentEmail) {
      return;
    }

    const indexedUser = await searchUserByIdRaw({ userId: data.sub });
    if (!indexedUser) {
      return;
    }

    const indexedEmail = (indexedUser.email || "").toLowerCase();
    if (indexedEmail === currentEmail.toLowerCase()) {
      return;
    }

    const updated = await updateUserDetailsInSearchIndex({
      userId: data.sub,
      userEmail: currentEmail,
      userPendingEmail: null,
    });
    if (updated) {
      logger.info(
        `Refreshed search index email for user ${data.sub} and ensured pendingEmail is cleared`,
        { correlationId },
      );
    } else {
      logger.warn(
        `Search index update did not apply for user ${data.sub} - user may no longer be indexed`,
        { correlationId },
      );
    }
  } catch (e) {
    logger.error(
      `Failed to sync email to search index for user ${data.sub} - ${e.message}`,
      { correlationId },
    );
  }
};

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
  await syncEmailToSearchIndex(
    data,
    `userupdated-searchsync-${jobId || uuid()}`,
    logger,
  );

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
