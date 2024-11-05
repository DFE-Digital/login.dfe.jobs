const users = require('./users');
const roles = require('./roles');
const organisations = require('./organisations');
const { v4:uuid } = require('uuid');

const register = async (config, logger) => {
  const correlationId = `register-${uuid()}`;
  const userHandlers = await users.register(config, logger, correlationId);
  const roleHandlers = await roles.register(config, logger, correlationId);
  const organisationHandlers = await organisations.register(config, logger, correlationId);

  return [
    ...userHandlers,
    ...roleHandlers,
    ...organisationHandlers,
  ];
};

module.exports = {
  register,
};
