const config = require('./infrastructure/config');
const logger = require('./infrastructure/logger');
const Monitor = require('./app/monitor');
const { getProcessorMappings } = require('./app/processors');
const http = require('http');
const https = require('https');
const KeepAliveAgent = require('agentkeepalive');
const express = require('express');
const bodyParser = require('body-parser');
const healthCheck = require('login.dfe.healthcheck');
const apiAuth = require('login.dfe.api.auth');
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
app.use(bodyParser.json());
app.use('/healthcheck', healthCheck({ config }));
app.get('/', (req, res) => {
  res.send();
});

if (config.hostingEnvironment.env !== 'dev') {
  app.use('/', apiAuth(app, config));
}
app.get('/monitor', async (req, res) => {
  res.json({ status: monitor.currentStatus });
});
app.patch('/monitor', async (req, res) => {
  const requestedState = req.body.state;
  if (requestedState === 'stopped') {
    if (monitor.currentStatus === 'stopped') {
      return res.status(304).send();
    }

    logger.info('Stopping monitor based on api request');
    await monitor.stop();
    return res.send();
  } else if(requestedState === 'started') {
    if (monitor.currentStatus === 'started') {
      return res.status(304).send();
    }

    logger.info('Starting monitor based on api request');
    await monitor.start();
    return res.send();
  }
  res.json({ status: monitor.currentStatus });
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
