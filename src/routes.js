const monitor = require('./app/monitor');
const jobs = require('./app/jobManagement');

const registerRoutes = (app) => {
  app.use('/monitor', monitor());
  app.use('/', jobs());
};

module.exports = registerRoutes;
