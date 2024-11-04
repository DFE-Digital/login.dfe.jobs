const { getAllApplicationRequiringNotification } = require('./../utils');
const roleUpdatedHandlerV1 = require('./roleUpdatedHandlerV1');
const sendWSRoleUpdatedV1 = require('./sendWSRoleUpdatedV1');

const applictionRequiringNotificationCondition = (a) => a.relyingParty && a.relyingParty.params && a.relyingParty.params.receiveRoleUpdates === 'true';

const register = async (config, logger, correlationId) => {
  const handlers = [
    roleUpdatedHandlerV1.getHandler(config, logger),
  ];

  const applications = await getAllApplicationRequiringNotification(config, applictionRequiringNotificationCondition, correlationId);
  handlers.push(...applications.map((application) => (sendWSRoleUpdatedV1.getHandler(config, logger, application))));

  return handlers;
};

module.exports = {
  register,
};