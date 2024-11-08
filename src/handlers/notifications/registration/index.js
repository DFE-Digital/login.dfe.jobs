const registerExistingUserV1 = require('./registerExistingUserV1');

const register = (config, logger) => {
  return [
    registerExistingUserV1.getHandler(config, logger),
  ];
};

module.exports = {
  register,
};