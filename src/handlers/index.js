const notifications = require("./notifications");
const publicApi = require("./publicApi");
const serviceNotifications = require("./serviceNotifications");

const registerExternalJobs = async (externalJobs, mappings, config, logger) => {
  const processors = await externalJobs.register(config, logger);
  processors.forEach((processor) => {
    mappings.push(processor);
    logger.debug(`Added ${processor.type} processor`);
  });
};

const getProcessorMappings = async (config, logger) => {
  const mappings = [];

  mappings.push({
    type: "test",
    processor: (jobData) => {
      logger.info(`Test job - ${JSON.stringify(jobData)}`);
      return Promise.resolve();
    },
  });
  logger.debug("Added test processor");

  await registerExternalJobs(notifications, mappings, config, logger);
  await registerExternalJobs(publicApi, mappings, config, logger);
  await registerExternalJobs(serviceNotifications, mappings, config, logger);

  return mappings;
};

module.exports = {
  getProcessorMappings,
};
