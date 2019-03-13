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
const { getErrorHandler } = require('login.dfe.express-error-handling');
const Monitor = require('./infrastructure/jobQueue/Monitor');

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
  const monitor = new Monitor(processorMapping);
  monitor.start();

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

  app.use((req, res, next) => {
    req.monitor = monitor;
    next();
  });
  registerRoutes(app);

  app.use(getErrorHandler({
    logger,
  }));

  app.listen(port, () => {
    logger.info(`Server listening on http://localhost:${port}`);
  });
}).catch((e) => {
  console.error(`FATAL error starting: ${e.stack}`);
  process.exit(1);
});

