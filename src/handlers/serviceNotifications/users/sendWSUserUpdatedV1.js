const { getRepository } = require("../../../infrastructure/repository");
const SecureAccessWebServiceClient = require("../../../infrastructure/webServices/SecureAccessWebServiceClient");
const { v4: uuid } = require("uuid");

const clientCache = [];

const getWebServiceClient = async (application, correlationId) => {
  const wsdlUrl = application.relyingParty.params.wsWsdlUrl;
  const username = application.relyingParty.params.wsUsername;
  const password = application.relyingParty.params.wsPassword;
  const requireAddressing = application.relyingParty.params
    .wsUseAddressingHeaders
    ? application.relyingParty.params.wsUseAddressingHeaders === "true"
    : false;
  const provisionUserFormatterType =
    application.relyingParty.params.wsProvisionUserFormatterType;

  let applicationClient = clientCache.find(
    (x) => x.applicationId === application.id,
  );
  if (!applicationClient) {
    const secureAccessWebServiceClient =
      await SecureAccessWebServiceClient.create(
        wsdlUrl,
        username,
        password,
        requireAddressing,
        correlationId,
      );
    applicationClient = {
      applicationId: application.id,
      secureAccessWebServiceClient,
    };

    if (provisionUserFormatterType) {
      secureAccessWebServiceClient.setProvisionUserFormatter(
        provisionUserFormatterType,
      );
    }

    clientCache.push(applicationClient);
  }
  return applicationClient.secureAccessWebServiceClient;
};

const getLastAction = async (
  repository,
  applicationId,
  userId,
  organisationId,
) => {
  try {
    const userEntity = await repository.userState.findOne({
      where: {
        service_id: applicationId,
        user_id: userId,
        organisation_id: organisationId,
      },
    });
    if (!userEntity) {
      return undefined;
    }

    return userEntity.last_action_sent;
  } catch (e) {
    throw new Error(`${e.message} thrown when getting previous state`);
  }
};
const sendUpdatedUserToApplication = async (
  action,
  user,
  application,
  correlationId,
) => {
  try {
    const secureAccessWebServiceClient = await getWebServiceClient(
      application,
      correlationId,
    );
    await secureAccessWebServiceClient.provisionUser(
      action,
      user.legacyUserId,
      user.legacyUsername,
      user.firstName,
      user.lastName,
      user.email,
      user.organisationId,
      user.status,
      user.organisationUrn,
      user.organisationLACode,
      user.roles,
      user.organisationUid,
    );
  } catch (e) {
    throw new Error(`${e.message} thrown when sending update to application`);
  }
};
const storeAction = async (
  repository,
  applicationId,
  userId,
  organisationId,
  action,
) => {
  try {
    await repository.userState.upsert({
      service_id: applicationId,
      user_id: userId,
      organisation_id: organisationId,
      last_action_sent: action,
    });
  } catch (e) {
    throw new Error(`${e.message} thrown when storing state`);
  }
};

const process = async (config, logger, application, data, jobId) => {
  const correlationId = `senduserupdated-${jobId || uuid()}`;
  const { applicationId, user } = data;
  let repository;

  try {
    repository = getRepository(config.persistentStorage);

    const previousAction = await getLastAction(
      repository,
      applicationId,
      user.userId,
      user.organisationId,
    );
    const action = previousAction ? "UPDATE" : "CREATE";

    await sendUpdatedUserToApplication(
      action,
      user,
      application,
      correlationId,
    );

    await storeAction(
      repository,
      applicationId,
      user.userId,
      user.organisationId,
      action,
    );
  } catch (e) {
    logger.error(
      `Error sending user update for ${user.userId} to ${applicationId} - ${e.message}`,
      {
        correlationId,
        stack: e.stack,
      },
    );
    throw e;
  } finally {
    // https://github.com/sequelize/sequelize/issues/8468
    if (repository.db) {
      repository.db.close();
    }
  }
};

const getHandler = (config, logger, application) => {
  return {
    type: `sendwsuserupdated_v1_${application.id}`,
    processor: async (data, jobId) => {
      await process(config, logger, application, data, jobId);
    },
  };
};

module.exports = {
  getHandler,
};
