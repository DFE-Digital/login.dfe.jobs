const invite = require("./invite");

const register = (config, logger) => {
  const inviteHandlers = invite.register(config, logger);

  return [...inviteHandlers];
};

module.exports = {
  register,
};
