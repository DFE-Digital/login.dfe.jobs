const rejectServiceV1 = require("./rejectServiceV1");

const register = (config, logger) => {
  return [rejectServiceV1.getHandler(config, logger)];
};

module.exports = {
  register,
};
