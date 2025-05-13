const http = require("http");
const https = require("https");
const express = require("express");
const bodyParser = require("body-parser");
const healthCheck = require("login.dfe.healthcheck");
const apiAuth = require("login.dfe.api.auth");
const { getErrorHandler } = require("login.dfe.express-error-handling");
const { getProcessorMappings } = require("./handlers");
const logger = require("./infrastructure/logger");
const config = require("./infrastructure/config");
const configSchema = require("./infrastructure/config/schema");
const registerRoutes = require("./routes");

const { setupApi } = require("login.dfe.api-client/api/setup");

const MonitorBull = require("./infrastructure/jobQueue/MonitorBull");

configSchema.validate();

logger.info("starting");

setupApi({
  auth: {
    tenant: config.publicApi.directories.service.auth.tenant,
    authorityHostUrl:
      config.publicApi.directories.service.auth.authorityHostUrl,
    clientId: config.publicApi.directories.service.auth.clientId,
    clientSecret: config.publicApi.directories.service.auth.clientSecret,
    resource: config.publicApi.directories.service.auth.resource,
  },
  api: {
    directories: {
      baseUri: config.publicApi.directories.service.url,
    },
  },
});

https.globalAgent.maxSockets = http.globalAgent.maxSockets =
  config.hostingEnvironment.agentKeepAlive.maxSockets || 50;

logger.info("Getting processor mappings");

getProcessorMappings(config, logger)
  .then((processorMapping) => {
    const monitor = new MonitorBull(processorMapping);

    monitor.start();

    async function stopMonitors() {
      await monitor.stop();
    }

    async function handleSignal(signal) {
      logger.info(`Recieved ${signal} signal`);
      try {
        await stopMonitors();
        logger.info("stopped");
        process.exit(0);
      } catch (e) {
        logger.error("Error stopping, ending process anyway", {
          error: { message: e.message, stack: e.stack },
        });
        process.exit(1);
      }
    }

    process.once("SIGTERM", () => handleSignal("SIGTERM"));
    process.once("SIGINT", () => handleSignal("SIGINT"));

    const port = process.env.PORT || 3000;
    const app = express();
    app.use(bodyParser.json());
    app.use("/healthcheck", healthCheck({ config }));
    app.get("/", (req, res) => {
      res.send();
    });

    if (config.hostingEnvironment.env !== "dev") {
      app.use("/", apiAuth(app, config));
    }

    app.use((req, res, next) => {
      req.monitor = monitor;
      next();
    });
    registerRoutes(app);

    app.use(
      getErrorHandler({
        logger,
      }),
    );

    app.listen(port, () => {
      logger.info(`Server listening on http://localhost:${port}`);
    });
  })
  .catch((e) => {
    logger.error("FATAL error starting", {
      error: { message: e.message, stack: e.stack },
    });
    process.exit(1);
  });
