const { fetchApi } = require("login.dfe.async-retry");
const jwt = require("jsonwebtoken");
const ApplicationsClient = require("../../../infrastructure/applications");
const { v4: uuid } = require("uuid");

const getToken = async (config, clientId, correlationId) => {
  let secret = config.publicApi.auth.jwtSecret;

  if (clientId) {
    const applications = new ApplicationsClient(
      config.publicApi.applications,
      correlationId,
    );
    const application = await applications.getApplication(clientId);
    if (!application) {
      throw new Error(`Cannot find application with client id ${clientId}`);
    }

    secret = application.relyingParty
      ? application.relyingParty.api_secret
      : undefined;
    if (!secret) {
      throw new Error(
        `No api secret configured for ${application.id} (clientId ${clientId})`,
      );
    }
  }

  return jwt.sign({}, secret, {
    expiresIn: "10m",
    issuer: "signin.education.gov.uk",
  });
};

const process = async (config, logger, data) => {
  const correlationId = `publicinvitationnotifyrelyingparty_v1-${uuid()}`;

  const { callback, userId, sourceId, state, clientId } = data;
  if (!callback) {
    return logger.info(
      `publicinvitationnotifyrelyingparty_v1 not called for invited user ${userId} as no callback was supplied`,
      { correlationId },
    );
  }

  const token = await getToken(config, clientId, correlationId);

  try {
    await fetchApi(callback, {
      method: "POST",
      headers: {
        authorization: `bearer ${token}`,
      },
      body: {
        sub: userId,
        sourceId,
        state,
      },
    });
  } catch (e) {
    logger.error(
      `Error notifying rp - ${e.message}. (userId: ${userId}, sourceId: ${sourceId}, callback: ${callback})`,
      { correlationId },
    );
    throw new Error(
      `Error notifying rp - ${e.message}. (userId: ${userId}, sourceId: ${sourceId}, callback: ${callback})`,
    );
  }
};

const getHandler = (config, logger) => {
  return {
    type: "publicinvitationnotifyrelyingparty_v1",
    processor: async (data) => {
      await process(config, logger, data);
    },
  };
};

module.exports = {
  getHandler,
};
