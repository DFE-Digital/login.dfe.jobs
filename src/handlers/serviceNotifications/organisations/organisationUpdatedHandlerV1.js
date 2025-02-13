const { getAllApplicationRequiringNotification } = require("../utils");
const { v4: uuid } = require("uuid");
const { bullEnqueue } = require("../../../infrastructure/jobQueue/BullHelpers");

const applictionRequiringNotificationCondition = (a) =>
  a.relyingParty &&
  a.relyingParty.params &&
  a.relyingParty.params.receiveOrganisationUpdates === "true";

const MAX_CATEGORY_TO_SYNC = 20;

const getRequiredJobs = async (config, logger, organisation, correlationId) => {
  const applications = await getAllApplicationRequiringNotification(
    config,
    applictionRequiringNotificationCondition,
    correlationId,
  );
  const jobs = applications.map((application) => ({
    organisation,
    applicationId: application.id,
  }));

  return jobs;
};

const process = async (config, logger, data, jobId) => {
  const correlationId = `organisationupdated-${jobId || uuid()}`;

  if (!jobDataIsValid) {
    return;
  }

  const jobs = await getRequiredJobs(config, logger, data, correlationId);

  for (let i = 0; i < jobs.length; i += 1) {
    await bullEnqueue(
      `sendwsorganisationupdated_v1_${jobs[i].applicationId}`,
      jobs[i],
    );
  }
};

const jobDataIsValid = (organisation) => {
  if (
    organisation.category &&
    parseInt(organisation.category.id) > MAX_CATEGORY_TO_SYNC
  ) {
    return false;
  }

  return true;
};

const getHandler = (config, logger) => {
  return {
    type: "organisationupdated_v1",
    processor: async (data, jobId) => {
      await process(config, logger, data, jobId);
    },
  };
};

module.exports = {
  getHandler,
};
