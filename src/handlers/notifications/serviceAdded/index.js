const userServiceAddedV1 = require('./newServiceAddedV1');
const userServiceAddedV2 = require('./newServiceAddedV2');

const register = (config, logger) => {
  return [
    userServiceAddedV1.getHandler(config, logger),
    userServiceAddedV2.getHandler(config, logger)
  ];
};

module.exports = {
  register
};
