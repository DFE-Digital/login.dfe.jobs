const express = require('express');
const { asyncWrapper } = require('login.dfe.express-error-handling');

const listJobs = require('./listJobs');
const listJobTypes = require('./listJobTypes');

const router = express.Router();

const area = () => {
  router.get('/', asyncWrapper(listJobs));
  router.get('/types', asyncWrapper(listJobTypes));

  return router;
};
module.exports = area;
