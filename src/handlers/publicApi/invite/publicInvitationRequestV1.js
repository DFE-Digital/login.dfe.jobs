const DirectoriesClient = require("../../../infrastructure/directories");
const OrganisationsClient = require("../../../infrastructure/organisations");
const JobsClient = require("../../../infrastructure/jobs");
const { v4: uuid } = require("uuid");
const { getUserRaw } = require("login.dfe.api-client/users");
const { getInvitation } = require("login.dfe.api-client/invitations");

const END_USER = 0;

const checkForExistingUser = async (
  organisations,
  jobs,
  email,
  organisation,
  sourceId,
  callback,
  clientId,
) => {
  const user = await getUserRaw({ by: { email: email } });
  if (user) {
    if (organisation) {
      await organisations.addOrganisationToUser(
        user.sub,
        organisation,
        END_USER,
      );
    }
    await jobs.queueNotifyRelyingParty(
      callback,
      user.sub,
      sourceId,
      "EXISTING_USER",
      clientId,
    );

    return true;
  }
  return false;
};

const checkForExistingInvitation = async (
  directories,
  organisations,
  email,
  organisation,
  sourceId,
  callback,
  clientId,
) => {
  const invitation = await getInvitation({ by: { email: email } });
  if (invitation) {
    if (!invitation.callbacks) {
      invitation.callbacks = [];
    }
    if (
      !invitation.callbacks.find(
        (x) => x.sourceId === sourceId && x.callback === callback,
      )
    ) {
      invitation.callbacks.push({
        sourceId,
        callback,
        state: "EXISTING_INVITATION",
        clientId,
      });
      await directories.updateInvitation(invitation);
    }

    if (organisation) {
      await organisations.addOrganisationToInvitation(
        invitation.id,
        organisation,
        END_USER,
      );
    }

    return true;
  }
  return false;
};

const createInvitation = async (
  directories,
  organisations,
  firstName,
  lastName,
  email,
  organisation,
  sourceId,
  callback,
  userRedirect,
  clientId,
  inviteSubjectOverride = null,
  inviteBodyOverride = null,
) => {
  const invitation = {
    firstName,
    lastName,
    email,
    origin: {
      clientId,
      redirectUri: userRedirect,
    },
    selfStarted: false,
    callbacks: [
      {
        sourceId,
        callback,
        state: "NEW_INVITATION",
        clientId,
      },
    ],
    overrides: {
      subject: inviteSubjectOverride,
      body: inviteBodyOverride,
    },
  };
  invitation.id = (await directories.createInvitation(invitation)).id;

  if (organisation) {
    await organisations.addOrganisationToInvitation(
      invitation.id,
      organisation,
      END_USER,
    );
  }
};

const process = async (config, logger, data) => {
  const {
    firstName,
    lastName,
    email,
    organisation,
    sourceId,
    callback,
    userRedirect,
    clientId,
    inviteSubjectOverride,
    inviteBodyOverride,
  } = data;
  const correlationId = `publicinvitationrequest_v1-${uuid()}`;
  const directories = new DirectoriesClient(
    config.publicApi.directories,
    correlationId,
  );
  const organisations = new OrganisationsClient(
    config.publicApi.organisations,
    correlationId,
  );
  const jobs = new JobsClient();

  const userAlreadyExists = await checkForExistingUser(
    organisations,
    jobs,
    email,
    organisation,
    sourceId,
    callback,
    clientId,
  );
  if (userAlreadyExists) {
    return;
  }

  const invitationAlreadyExists = await checkForExistingInvitation(
    directories,
    organisations,
    email,
    organisation,
    sourceId,
    callback,
    clientId,
  );
  if (invitationAlreadyExists) {
    return;
  }

  await createInvitation(
    directories,
    organisations,
    firstName,
    lastName,
    email,
    organisation,
    sourceId,
    callback,
    userRedirect,
    clientId,
    inviteSubjectOverride,
    inviteBodyOverride,
  );
};

const getHandler = (config, logger) => {
  return {
    type: "publicinvitationrequest_v1",
    processor: async (data) => {
      await process(config, logger, data);
    },
  };
};

module.exports = {
  getHandler,
};
