const { getAllApplicationRequiringNotification, enqueue } = require('./../utils');
const kue = require('login.dfe.kue');
const { v4:uuid } = require('uuid');

const applictionRequiringNotificationCondition = (a) => a.relyingParty && a.relyingParty.params && a.relyingParty.params.receiveRoleUpdates === 'true';

const getRequiredJobs = async (config, logger, role, correlationId) => {
  const applications = await getAllApplicationRequiringNotification(config, applictionRequiringNotificationCondition, correlationId);
  const jobs = applications.map((application) => ({
    role,
    applicationId: application.id,
  }));

  return jobs;
};

const process = async (config, logger, data, jobId) => {
  const correlationId = `roleupdated-${jobId || uuid()}`;

  const jobs = await getRequiredJobs(config, logger, data, correlationId);

  const queue = kue.createQueue({
    redis: config.queueStorage.connectionString,
  });
  for (let i = 0; i < jobs.length; i += 1) {
    await enqueue(queue, `sendwsroleupdated_v1_${jobs[i].applicationId}`, jobs[i]);
  }
};

const getHandler = (config, logger) => {
  return {
    type: 'roleupdated_v1',
    processor: async (data, jobId) => {
      await process(config, logger, data, jobId);
    }
  };
};

module.exports = {
  getHandler,
};