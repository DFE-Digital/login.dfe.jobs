const v1 = require('./confirmMigratedEmailV1');

const register = (config, logger) => {
  return [
    v1.getHandler(config, logger),
  ];
};

module.exports = {
  register,
};