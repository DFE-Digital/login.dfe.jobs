const migrationAdmin = require('login.dfe.migration.admin.job');
const notifications = require('login.dfe.notification.jobs');
const publicApi = require('login.dfe.public-api.jobs');
const serviceNotifications = require('login.dfe.service-notifications.jobs');

const registerExternalJobs = async (externalJobs, mappings, config, logger) => {
  const processors = await externalJobs.register(config, logger);
  processors.forEach((processor) => {
    mappings.push(processor);
    logger.info(`Added ${processor.type} processor`);
  });
};

const getProcessorMappings = async (config, logger) => {
  const mappings = [];

  mappings.push({
    type: 'test',
    processor: (jobData) => {
      logger.info(`Test job - ${JSON.stringify(jobData)}`);
      return Promise.resolve();
    },
  });
  logger.info('Added test processor');

  if (config.registration && config.registration.enableAdmin) {
    await registerExternalJobs(migrationAdmin, mappings, config, logger);
  }

  if (config.registration && config.registration.enableNotifications) {
    await registerExternalJobs(notifications, mappings, config, logger);
  }

  if (config.registration && config.registration.enablePublicApi) {
    await registerExternalJobs(publicApi, mappings, config, logger);
  }

  if (config.registration && config.registration.enableServiceNotifications) {
    await registerExternalJobs(serviceNotifications, mappings, config, logger);
  }

  return mappings;
};

module.exports = {
  getProcessorMappings,
};
