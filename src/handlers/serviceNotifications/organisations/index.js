const { getAllApplicationRequiringNotification } = require('./../utils');
const organisationUpdatedHandlerV1 = require('./organisationUpdatedHandlerV1');
const sendWSOrganisationUpdatedV1 = require('./sendWSOrganisationUpdatedV1');

const applictionRequiringNotificationCondition = (a) => a.relyingParty && a.relyingParty.params && a.relyingParty.params.receiveOrganisationUpdates === 'true';

const register = async (config, logger, correlationId) => {
  const handlers = [
    organisationUpdatedHandlerV1.getHandler(config, logger),
  ];

  const applications = await getAllApplicationRequiringNotification(config, applictionRequiringNotificationCondition, correlationId);
  handlers.push(...applications.map((application) => (sendWSOrganisationUpdatedV1.getHandler(config, logger, application))));

  return handlers;
};

module.exports = {
  register,
};