const publicInvitationRequestV1 = require('./publicInvitationRequestV1');
const publicInvitationCompleteV1 = require('./publicInvitationCompleteV1');
const publicInvitationNotifyRelyingPartyV1 = require('./publicInvitationNotifyRelyingPartyV1');

const register = (config, logger) => {
  return [
    publicInvitationRequestV1.getHandler(config, logger),
    publicInvitationCompleteV1.getHandler(config, logger),
    publicInvitationNotifyRelyingPartyV1.getHandler(config, logger),
  ];
};

module.exports = {
  register,
};