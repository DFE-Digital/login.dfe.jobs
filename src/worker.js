const config = require('./infrastructure/config');
const logger = require('./infrastructure/logger');
const Monitor = require('./app/monitor');
const { getProcessorMappings } = require('./app/processors');
const http = require('http');
const https = require('https');
const KeepAliveAgent = require('agentkeepalive');

const { jobsSchema, validateConfig } = require('login.dfe.config.schema');

validateConfig(jobsSchema, config, logger, config.hostingEnvironment.env !== 'dev');

logger.info('starting');

http.GlobalAgent = new KeepAliveAgent({
  maxSockets: 10,
  maxFreeSockets: 2,
  timeout: 60000,
  keepAliveTimeout: 300000,
});
https.GlobalAgent = new KeepAliveAgent({
  maxSockets: 10,
  maxFreeSockets: 2,
  timeout: 60000,
  keepAliveTimeout: 300000,
});

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
