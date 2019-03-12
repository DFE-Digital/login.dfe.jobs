const monitor = require('./app/monitor');

const registerRoutes = (app, processorMapping) => {
  app.use('/monitor', monitor(processorMapping));
};

module.exports = registerRoutes;
