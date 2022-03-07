'use strict';

const { createLogger, format, transports } = require('winston');
const config = require('./../config');
const appInsights = require('applicationinsights');
const AppInsightsTransport = require('login.dfe.winston-appinsights');

const logLevel = (config && config.loggerSettings && config.loggerSettings.logLevel) ? config.loggerSettings.logLevel : 'info';

const levelsAndColor = {
  levels: {
    audit: 0,
    error: 1,
    warn: 2,
    info: 3,
    verbose: 4,
    debug: 5,
    silly: 6,
  },
  colors: {
    info: 'yellow',
    ok: 'green',
    error: 'red',
    audit: 'magenta',
  },
};

const loggerConfig = {
  levels: levelsAndColor.levels,
  colorize: true,
  format: format.combine(
    format.simple(),
  ),
  transports: [],
};

loggerConfig.transports.push(new transports.Console({
  level: logLevel,
  colorize: true,
  format: format.combine(
    format.simple(),
  ),
}));

if (config.hostingEnvironment.applicationInsights) {
  appInsights.setup(config.hostingEnvironment.applicationInsights).setAutoCollectConsole(false, false).start();
  loggerConfig.transports.push(new AppInsightsTransport({
    client: appInsights.defaultClient,
    applicationName: config.loggerSettings.applicationName || 'Jobs',
    type: 'event',
    treatErrorsAsExceptions: true,
  }));
}

const logger = createLogger(loggerConfig);

process.on('unhandledRejection', (reason, p) => {
  logger.error('Unhandled Rejection at:', p, 'reason: ', reason);
});

module.exports = logger;
