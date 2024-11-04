const accessRequestV1 = require('./accessRequestV1');
const approverAccessRequestV1 = require('./approverAccessRequestV1');
const organisationRequestHandlerV1 = require('./organisationRequestHanderV1');
const userAccessRequestV1 = require('./userAccessRequestV1');

const register = (config, logger) => {
  return [
    accessRequestV1.getHandler(config, logger),
    approverAccessRequestV1.getHandler(config, logger),
    organisationRequestHandlerV1.getHandler(config, logger),
    userAccessRequestV1.getHandler(config, logger),
  ];
};

module.exports = {
  register,
};
