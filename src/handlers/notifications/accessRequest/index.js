const accessRequestV1 = require("./accessRequestV1");
const approverAccessRequestV1 = require("./approverAccessRequestV1");
const organisationRequestHandlerV1 = require("./organisationRequestHanderV1");
const organisationRequestOutcomeToApprovers = require("./organisationRequestOutcomeToApprovers");

const register = (config, logger) => {
  return [
    accessRequestV1.getHandler(config, logger),
    approverAccessRequestV1.getHandler(config, logger),
    organisationRequestHandlerV1.getHandler(config, logger),
    organisationRequestOutcomeToApprovers.getHandler(config, logger),
  ];
};

module.exports = {
  register,
};
