const { v4:uuid } = require('uuid');
const organisations = require('./organisations');
const roles = require('./roles');
const users = require('./users');

const register = async (config, logger) => {
  const correlationId = `register-${uuid()}`;
  const organisationHandlers = await organisations.register(config, logger, correlationId);
  const roleHandlers = await roles.register(config, logger, correlationId);
  const userHandlers = await users.register(config, logger, correlationId);

  return [
    ...organisationHandlers,
    ...roleHandlers,
    ...userHandlers,
  ];
};

module.exports = {
  register,
};
