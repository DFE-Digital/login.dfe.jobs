const subServiceRequested = require('./subServiceRequestToApprovers');

const register = (config, logger) => [
  subServiceRequested.getHandler(config, logger),
];

module.exports = {
  register,
};
