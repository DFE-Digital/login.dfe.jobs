const serviceRequestOutcomeToApprovers = require("./serviceRequestOutcomeToApprovers");

const register = (config, logger) => {
  return [serviceRequestOutcomeToApprovers.getHandler(config, logger)];
};

module.exports = {
  register,
};
