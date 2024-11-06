const newUserInvitationV1 = require('./newUserInvitationV1');
const newUserInvitationV2 = require('./newUserInvitationV2');

const register = (config, logger) => {
  return [
    newUserInvitationV1.getHandler(config, logger),
    newUserInvitationV2.getHandler(config, logger),
  ];
};

module.exports = {
  register,
};
