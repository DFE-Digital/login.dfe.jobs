const userServiceRemovedV1 = require("./userServiceRemovedV1");

const register = (config, logger) => {
  return [userServiceRemovedV1.getHandler(config, logger)];
};

module.exports = {
  register,
};
