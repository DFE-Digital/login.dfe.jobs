const config = require('./infrastructure/config');
const logger = require('./infrastructure/logger');
const Monitor = require('./app/monitor');
const { getProcessorMappings } = require('./app/processors');

const { jobsSchema } = require('login.dfe.config.schema');
const validationResult = jobsSchema.validate(config);
if (!validationResult.isValid) {
  logger.error('Config is invalid!');
  validationResult.errors.forEach((item) => {
    logger.error(JSON.stringify(item));
  });
  return process.exit(1);
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