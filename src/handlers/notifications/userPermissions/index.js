const changeUserPermissionLevelV1 = require('./changeUserPermissionLevelV1');

const register = (config, logger) => {
  return [
    changeUserPermissionLevelV1.getHandler(config, logger)
  ];
};

module.exports = {
  register
};
