const monitor = require('./app/monitor');
const jobs = require('./app/jobManagement');

const registerRoutes = (app) => {
  app.use('/jobs/monitor', monitor());
  app.use('/jobs', jobs());
};

module.exports = registerRoutes;
