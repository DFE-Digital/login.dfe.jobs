const registerExistingUserV1 = require('./registerExistingUserV1');
const registrationCompleteV1 = require('./registrationCompleteV1');

const register = (config, logger) => {
  return [
    registerExistingUserV1.getHandler(config, logger),

    registrationCompleteV1.getHandler(config, logger),
  ];
};

module.exports = {
  register,
};