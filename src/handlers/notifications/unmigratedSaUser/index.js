const unmigratedSaUserV1 = require('./unmigratedSaUserV1');

const register = (config, logger) => {
  return [
    unmigratedSaUserV1.getHandler(config, logger),
  ];
};

module.exports = {
  register,
};
