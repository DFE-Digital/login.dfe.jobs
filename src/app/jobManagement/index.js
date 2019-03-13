const express = require('express');
const { asyncWrapper } = require('login.dfe.express-error-handling');

const listJobs = require('./listJobs');

const router = express.Router();

const area = () => {
  router.get('/', asyncWrapper(listJobs));

  return router;
};
module.exports = area;
