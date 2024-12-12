const monitor = require('./app/monitor');

const registerRoutes = (app) => {
  app.use('/monitor', monitor());
};

module.exports = registerRoutes;
