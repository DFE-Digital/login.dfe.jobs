const JobsClient = require("../../../infrastructure/jobs");
const {
  getUserRaw,
  addOrganisationToUser,
} = require("login.dfe.api-client/users");
const {
  getInvitationRaw,
  updateInvitation,
  createInvitation,
  addOrganisationToInvitation,
} = require("login.dfe.api-client/invitations");

const END_USER = 0;

const checkForExistingUser = async (
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
      await addOrganisationToUser({
        userId: user.sub,
        organisationId: organisation,
        roleId: END_USER,
      });
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
  email,
  organisation,
  sourceId,
  callback,
  clientId,
) => {
  const invitation = await getInvitationRaw({ by: { email: email } });
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
        callbackUri: callback,
        state: "EXISTING_INVITATION",
        clientId,
      });

      await updateInvitation({
        ...invitation,
        ...{ invitationId: invitation.id },
      });
    }

    if (organisation) {
      await addOrganisationToInvitation({
        invitationId: invitation.id,
        organisationId: organisation,
        roleId: END_USER,
      });
    }

    return true;
  }
  return false;
};

const createUserInvitation = async (
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
    clientId,
    redirectUri: userRedirect,
    selfStarted: false,
    callbacks: [
      {
        sourceId,
        callbackUri: callback,
        state: "NEW_INVITATION",
      },
    ],
    overrides: {
      subject: inviteSubjectOverride,
      body: inviteBodyOverride,
    },
  };
  invitation.id = (await createInvitation(invitation)).id;

  if (organisation) {
    await addOrganisationToInvitation({
      invitationId: invitation.id,
      organisationId: organisation,
      roleId: END_USER,
    });
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

  const jobs = new JobsClient();

  const userAlreadyExists = await checkForExistingUser(
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
    email,
    organisation,
    sourceId,
    callback,
    clientId,
  );
  if (invitationAlreadyExists) {
    return;
  }

  await createUserInvitation(
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
