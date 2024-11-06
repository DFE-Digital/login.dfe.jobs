const subServiceRequestApproved = require('./subServiceRequestApproved');
const subServiceRequestRejected = require('./subServiceRequestRejected');
const register = (config, logger) => [
  subServiceRequestApproved.getHandler(config, logger),
  subServiceRequestRejected.getHandler(config, logger),
];
module.exports = {
  register,
};
