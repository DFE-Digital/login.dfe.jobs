const exsitingUserAddedToOrgV1 = require("./exsitingUserAddedToOrgV1");
const removedUserFromOrgV1 = require("./removedUserFromOrgV1");

const register = (config, logger) => {
  return [
    exsitingUserAddedToOrgV1.getHandler(config, logger),
    removedUserFromOrgV1.getHandler(config, logger),
  ];
};

module.exports = {
  register,
};
