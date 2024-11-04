const supportRequestV1 = require('./supportRequestV1');
const supportRequestConfirmationV1 = require('./supportRequestConfirmationV1');
const supportOverdueRequest = require('./supportOverdueRequest');

const register = (config, logger) => {
  return [
    supportRequestV1.getHandler(config, logger),
    supportRequestConfirmationV1.getHandler(config, logger),
    supportOverdueRequest.getHandler(config, logger),
  ];
};

module.exports = {
  register,
};
