const migrationAdmin = require('login.dfe.migration.admin.job');
const notifications = require('login.dfe.notification.jobs');

const registerExternalJobs = (externalJobs, mappings, config, logger) => {
  const processors = externalJobs.register(config, logger);
  processors.forEach((processor) => {
    mappings.push(processor);
    logger.info(`Added ${processor.type} processor`);
  });
};

const getProcessorMappings = (config, logger) => {
  const mappings = [];

  mappings.push({
    type: 'test',
    processor: (jobData) => {
      logger.info(`Test job - ${JSON.stringify(jobData)}`);
      return Promise.resolve();
    },
  });
  logger.info('Added test processor');

  registerExternalJobs(migrationAdmin, mappings, config, logger);
  registerExternalJobs(notifications, mappings, config, logger);

  return mappings;
};

module.exports = {
  getProcessorMappings,
};
