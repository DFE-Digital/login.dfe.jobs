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
  const provisionGroupFormatterType =
    application.relyingParty.params.wsProvisionGroupFormatterType;

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

    if (provisionGroupFormatterType) {
      secureAccessWebServiceClient.setProvisionGroupFormatter(
        provisionGroupFormatterType,
      );
    }

    clientCache.push(applicationClient);
  }
  return applicationClient.secureAccessWebServiceClient;
};

const getLastAction = async (repository, applicationId, roleId) => {
  try {
    const entity = await repository.roleState.findOne({
      where: {
        service_id: applicationId,
        role_id: roleId,
      },
    });
    if (!entity) {
      return undefined;
    }

    return entity.last_action_sent;
  } catch (e) {
    throw new Error(`${e.message} thrown when getting previous state`);
  }
};
const sendUpdatedUserToApplication = async (
  action,
  role,
  application,
  config,
  correlationId,
) => {
  try {
    const status = role.status.id === 1 ? "Active" : "Archived";
    const secureAccessWebServiceClient = await getWebServiceClient(
      application,
      correlationId,
    );
    await secureAccessWebServiceClient.provisionGroup(
      action,
      role.numericId,
      role.code,
      role.name,
      status,
      role.parent ? role.parent.numericId : null,
      role.parent ? role.parent.code : null,
    );
  } catch (e) {
    throw new Error(`${e.message} thrown when sending update to application`);
  }
};
const storeAction = async (repository, applicationId, roleId, action) => {
  try {
    await repository.roleState.upsert({
      service_id: applicationId,
      role_id: roleId,
      last_action_sent: action,
    });
  } catch (e) {
    throw new Error(`${e.message} thrown when storing state`);
  }
};

const process = async (config, logger, application, data, jobId) => {
  const correlationId = `sendwsroleupdated-${jobId || uuid()}`;
  const { role } = data;
  let repository;
  try {
    repository = getRepository(config.persistentStorage);

    const previousAction = await getLastAction(
      repository,
      application.id,
      role.id,
    );
    const action = previousAction ? "UPDATE" : "CREATE";

    await sendUpdatedUserToApplication(
      action,
      role,
      application,
      config,
      correlationId,
    );

    await storeAction(repository, application.id, role.id, action);
  } catch (e) {
    logger.error(
      `Error sending role update for ${role.id} to ${application.id} - ${e.message}`,
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
    type: `sendwsroleupdated_v1_${application.id}`,
    processor: async (data, jobId) => {
      await process(config, logger, application, data, jobId);
    },
  };
};

module.exports = {
  getHandler,
};
