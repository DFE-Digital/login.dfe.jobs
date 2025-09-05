const accessRequest = require("./accessRequest");
const changeProfile = require("./changeProfile");
const changeUserPermission = require("./userPermissions");
const invite = require("./invite");
const newServiceAdded = require("./serviceAdded");
const passwordReset = require("./passwordReset");
const registration = require("./registration");
const serviceRemoved = require("./serviceRemoved");
const serviceRequested = require("./serviceRequested");
const serviceRequestActioned = require("./serviceRequestActioned");
const serviceRequestRejected = require("./serviceRequestRejected");
const subServiceRequestActioned = require("./subServiceRequestActioned");
const subServiceRequested = require("./subServiceRequested");
const support = require("./support");
const userOrganisation = require("./userOrganisation");

const register = (config, logger) => {
  const accessRequestHandler = accessRequest.register(config, logger);
  const changeProfileHandlers = changeProfile.register(config, logger);
  const changeUserPermissionHandler = changeUserPermission.register(
    config,
    logger,
  );
  const inviteHandlers = invite.register(config, logger);
  const newServiceAddedHandler = newServiceAdded.register(config, logger);
  const passwordResetHandlers = passwordReset.register(config, logger);
  const registrationHandlers = registration.register(config, logger);
  const serviceRemovedHandler = serviceRemoved.register(config, logger);
  const serviceRequestedHandler = serviceRequested.register(config, logger);
  const serviceRequestActionedHandler = serviceRequestActioned.register(
    config,
    logger,
  );
  const serviceRequestRejectedHandler = serviceRequestRejected.register(
    config,
    logger,
  );
  const subServiceRequestActionedHandler = subServiceRequestActioned.register(
    config,
    logger,
  );
  const subServiceRequestedHandler = subServiceRequested.register(
    config,
    logger,
  );
  const supportHandlers = support.register(config, logger);
  const userOrganisationHandler = userOrganisation.register(config, logger);

  return [
    ...accessRequestHandler,
    ...changeProfileHandlers,
    ...changeUserPermissionHandler,
    ...inviteHandlers,
    ...newServiceAddedHandler,
    ...passwordResetHandlers,
    ...registrationHandlers,
    ...serviceRemovedHandler,
    ...serviceRequestedHandler,
    ...serviceRequestActionedHandler,
    ...serviceRequestRejectedHandler,
    ...subServiceRequestActionedHandler,
    ...subServiceRequestedHandler,
    ...supportHandlers,
    ...userOrganisationHandler,
  ];
};

module.exports = {
  register,
};
