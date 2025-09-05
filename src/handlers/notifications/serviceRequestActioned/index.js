const userServiceRequestOutcomeToApprovers = require("./userServiceRequestOutcomeToApprovers");

const register = (config, logger) => {
  return [userServiceRequestOutcomeToApprovers.getHandler(config, logger)];
};

module.exports = {
  register,
};
