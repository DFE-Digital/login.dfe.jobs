const migrationAdmin = require('login.dfe.migration.admin.job');
const notifications = require('login.dfe.notification.jobs');
const publicApi = require('login.dfe.public-api.jobs');
const serviceNotifications = require('login.dfe.service-notifications.jobs');

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
  registerExternalJobs(publicApi, mappings, config, logger);
  registerExternalJobs(serviceNotifications, mappings, config, logger);

  return mappings;
};

module.exports = {
  getProcessorMappings,
};
