const v1 = require('./passwordResetV1');
const SAResetv1 = require('./SAResetV1');

const register = (config, logger) => {
  return [
    v1.getHandler(config, logger),
    SAResetv1.getHandler(config, logger),
  ];
};

module.exports = {
  register,
};
