const express = require('express');
const { asyncWrapper } = require('login.dfe.express-error-handling');

const listJobs = require('./listJobs');
const getJob = require('./getJob');
const listJobTypes = require('./listJobTypes');
const listJobsOfType = require('./listJobsOfType');

const router = express.Router();

const area = () => {
  router.get('/', asyncWrapper(listJobs));
  router.get('/types', asyncWrapper(listJobTypes));
  router.get('/types/:type', asyncWrapper(listJobsOfType));
  router.get('/:id', asyncWrapper(getJob));

  return router;
};
module.exports = area;
