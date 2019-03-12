const config = require('./infrastructure/config');
const logger = require('./infrastructure/logger');
const { getProcessorMappings } = require('./app/processors');
const http = require('http');
const https = require('https');
const KeepAliveAgent = require('agentkeepalive');
const express = require('express');
const bodyParser = require('body-parser');
const healthCheck = require('login.dfe.healthcheck');
const apiAuth = require('login.dfe.api.auth');
const configSchema = require('./infrastructure/config/schema');
const registerRoutes = require('./routes');

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

logger.info('Getting processor mappings');
getProcessorMappings(config, logger).then((processorMapping) => {
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

  registerRoutes(app, processorMapping);

  app.listen(port, () => {
    logger.info(`Server listening on http://localhost:${port}`);
  });
}).catch((e) => {
  console.error(`FATAL error starting: ${e.stack}`);
  process.exit(1);
});

