const config = require('./infrastructure/config');
const logger = require('./infrastructure/logger');
const Monitor = require('./app/monitor');
const { getProcessorMappings } = require('./app/processors');
const appInsights = require('applicationinsights');

const { jobsSchema, validateConfigAndQuitOnError } = require('login.dfe.config.schema');

validateConfigAndQuitOnError(jobsSchema, config, logger);
if (config.hostingEnvironment.applicationInsights) {
  appInsights.setup(config.hostingEnvironment.applicationInsights).start();
}

logger.info('starting');

const processorMapping = getProcessorMappings(config, logger);

const monitor = new Monitor(processorMapping);
monitor.start();

const stop = () => {
  logger.info('stopping');
  monitor.stop().then(() => {
    logger.info('stopped');
    process.exit(0);
  });
};
process.once('SIGTERM', stop);
