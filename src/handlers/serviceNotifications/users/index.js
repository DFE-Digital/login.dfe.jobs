const { getAllApplicationRequiringNotification } = require("./../utils");
const userUpdatedHandlerV1 = require("./userUpdatedHandlerV1");
const sendWSUserUpdatedV1 = require("./sendWSUserUpdatedV1");
const { canReceiveUserUpdate } = require("./userUpdateEligibility");

const applictionRequiringNotificationCondition = (a) => canReceiveUserUpdate(a);

const register = async (config, logger, correlationId) => {
  const handlers = [userUpdatedHandlerV1.getHandler(config, logger)];

  const candidateApplications = await getAllApplicationRequiringNotification(
    config,
    applictionRequiringNotificationCondition,
    correlationId,
  );
  handlers.push(
    ...candidateApplications.map((application) =>
      sendWSUserUpdatedV1.getHandler(config, logger, application),
    ),
  );

  return handlers;
};

module.exports = {
  register,
};
