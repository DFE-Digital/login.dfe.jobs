const serviceRequestedV2 = require('./serviceRequestToApproversV2');

const register = (config, logger) => {
  return [
    serviceRequestedV2.getHandler(config, logger),
  ];
};

module.exports = {
  register
};
