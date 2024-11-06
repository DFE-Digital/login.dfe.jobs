const { getAllApplicationRequiringNotification } = require('./../utils');
const userUpdatedHandlerV1 = require('./userUpdatedHandlerV1');
const sendWSUserUpdatedV1 = require('./sendWSUserUpdatedV1');


const applictionRequiringNotificationCondition = (a) => a.relyingParty && a.relyingParty.params && a.relyingParty.params.receiveUserUpdates === 'true';

const register = async (config, logger, correlationId) => {
  const handlers = [
    userUpdatedHandlerV1.getHandler(config, logger),
  ];

  const applications = await getAllApplicationRequiringNotification(config, applictionRequiringNotificationCondition, correlationId);
  handlers.push(...applications.map((application) => (sendWSUserUpdatedV1.getHandler(config, logger, application))));

  return handlers;
};

module.exports = {
  register,
};