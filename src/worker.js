const config = require('./infrastructure/config');
const logger = require('./infrastructure/logger');
const Monitor = require('./app/monitor');
const { getProcessorMappings } = require('./app/processors');
const http = require('http');
const https = require('https');
const KeepAliveAgent = require('agentkeepalive');
const express = require('express');
const healthCheck = require('login.dfe.healthcheck');
const configSchema = require('./infrastructure/config/schema');

configSchema.validate();

logger.info('starting');

http.GlobalAgent = new KeepAliveAgent({
  maxSockets: config.hostingEnvironment.agentKeepAlive.maxSockets,
  maxFreeSockets: config.hostingEnvironment.agentKeepAlive.maxFreeSockets,
  timeout: config.hostingEnvironment.agentKeepAlive.timeout,
  keepAliveTimeout: config.hostingEnvironment.agentKeepAlive.keepAliveTimeout,
});
https.GlobalAgent = new KeepAliveAgent({
  maxSockets: config.hostingEnvironment.agentKeepAlive.maxSockets,
  maxFreeSockets: config.hostingEnvironment.agentKeepAlive.maxFreeSockets,
  timeout: config.hostingEnvironment.agentKeepAlive.timeout,
  keepAliveTimeout: config.hostingEnvironment.agentKeepAlive.keepAliveTimeout,
});

const processorMapping = getProcessorMappings(config, logger);

const monitor = new Monitor(processorMapping);
monitor.start();

const port = process.env.PORT || 3000;
const app = express();
app.use('/healthcheck', healthCheck({ config }));
app.get('/', (req, res) => {
  res.send();
});
app.listen(port, () => {
  logger.info(`Server listening on http://localhost:${port}`);
});

const stop = () => {
  logger.info('stopping');
  monitor.stop().then(() => {
    logger.info('stopped');
    process.exit(0);
  }).catch((e) => {
    logger.error(`Error stopping - ${e}. Ending process anyway`);
    process.exit(1);
  })
};
process.once('SIGTERM', stop);
process.once('SIGINT', stop);
