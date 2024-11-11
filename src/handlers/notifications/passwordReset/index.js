const v1 = require('./passwordResetV1');

const register = (config, logger) => {
  return [
    v1.getHandler(config, logger),
  ];
};

module.exports = {
  register,
};
