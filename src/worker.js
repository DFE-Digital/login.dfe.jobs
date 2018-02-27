const config = require('./infrastructure/config');
const logger = require('./infrastructure/logger');
const Monitor = require('./app/monitor');
const { getProcessorMappings } = require('./app/processors');

const { jobsSchema, validateConfig } = require('login.dfe.config.schema');

validateConfig(jobsSchema, config, logger, config.hostingEnvironment.env !== 'dev');

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
