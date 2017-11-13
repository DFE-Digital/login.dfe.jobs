const logger = require('./infrastructure/logger');
const Monitor = require('./app/monitor');

logger.info('starting');

const processorMapping = [];
// TODO: load handlers
processorMapping.push({
  type: 'test',
  processor: (jobData) => {
    logger.info(`Test job - ${JSON.stringify(jobData)}`);
    return Promise.resolve();
  },
});

const monitor = new Monitor(processorMapping);
monitor.start();
process.once('SIGTERM', function () {
  monitor.stop().then(() => {
    process.exit(0);
  });
});