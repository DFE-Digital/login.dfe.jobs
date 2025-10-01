const subServiceRequestApproved = require("./subServiceRequestApproved");
const subServiceRequestRejected = require("./subServiceRequestRejected");
const subServiceRequestOutcomeToApprovers = require("./subServiceRequestOutcomeToApprovers");
const register = (config, logger) => [
  subServiceRequestApproved.getHandler(config, logger),
  subServiceRequestRejected.getHandler(config, logger),
  subServiceRequestOutcomeToApprovers.getHandler(config, logger),
];
module.exports = {
  register,
};
