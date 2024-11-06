const invite = require('./invite');
const passwordReset = require('./passwordReset');
const support = require('./support');
const registration = require('./registration');
const confirmMigratedEmail = require('./confirmMigratedEmail');
const changeProfile = require('./changeProfile');
const accessRequest = require('./accessRequest');
const unmigratedSaUser = require('./unmigratedSaUser');
const newServiceAdded = require('./serviceAdded');
const userOrganisation = require('./userOrganisation');
const changeUserPermission = require('./userPermissions');
const serviceRemoved = require('./serviceRemoved');
const serviceRequested = require('./serviceRequested');
const serviceRequestRejected = require('./serviceRequestRejected');
const subServiceRequested = require('./subServiceRequested');
const subServiceRequestActioned = require('./subServiceRequestActioned')

const register = (config, logger) => {
  const inviteHandlers = invite.register(config, logger);
  const passwordResetHandlers = passwordReset.register(config, logger);
  const supportHandlers = support.register(config, logger);
  const registrationHandlers = registration.register(config, logger);
  const confirmMigratedEmailHandlers = confirmMigratedEmail.register(config,logger);
  const changeProfileHandlers = changeProfile.register(config, logger);
  const accessRequestHandler = accessRequest.register(config, logger);
  const unmigratedSaUserHandler = unmigratedSaUser.register(config, logger);
  const newServiceAddedHandler = newServiceAdded.register(config, logger);
  const userOrganisationHandler = userOrganisation.register(config,logger);
  const changeUserPermissionHandler = changeUserPermission.register(config, logger);
  const serviceRemovedHandler = serviceRemoved.register(config, logger);
  const serviceRequestedHandler = serviceRequested.register(config, logger);
  const serviceRequestRejectedHandler = serviceRequestRejected.register(config, logger);
  const subServiceRequestedHandler = subServiceRequested.register(config, logger);
  const subServiceRequestActionedHandler = subServiceRequestActioned.register(config,logger);

  return [
    ...inviteHandlers,
    ...passwordResetHandlers,
    ...supportHandlers,
    ...registrationHandlers,
    ...confirmMigratedEmailHandlers,
    ...changeProfileHandlers,
    ...accessRequestHandler,
    ...unmigratedSaUserHandler,
    ...newServiceAddedHandler,
    ...userOrganisationHandler,
    ...changeUserPermissionHandler,
    ...serviceRemovedHandler,
    ...serviceRequestedHandler,
    ...serviceRequestRejectedHandler,
    ...subServiceRequestedHandler,
    ...subServiceRequestActionedHandler,
  ];
};

module.exports = {
  register
};
