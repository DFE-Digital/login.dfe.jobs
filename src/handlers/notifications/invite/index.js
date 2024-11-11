const newUserInvitationV2 = require('./newUserInvitationV2');

const register = (config, logger) => {
  return [
    newUserInvitationV2.getHandler(config, logger),
  ];
};

module.exports = {
  register,
};
