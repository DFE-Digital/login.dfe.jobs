const union = require('lodash/union');
const invite = require('./invite');

const register = (config, logger) => {
  const inviteHandlers = invite.register(config, logger);

  return union(inviteHandlers);
};

module.exports = {
  register,
};
