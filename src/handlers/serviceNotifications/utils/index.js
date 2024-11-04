const ApplicationsClient = require('../../../infrastructure/applications');

const getAllApplicationRequiringNotification = async (config, condition, correlationId, moveChildrenToParent = false) => {
  const applicationsClient = new ApplicationsClient(config.serviceNotifications.applications, correlationId);
  let pageNumber = 1;
  let hasMorePages = true;
  let applications = [];
  while (hasMorePages) {
    const page = await applicationsClient.listApplications(pageNumber, 100);

    if (page.services && page.services.length > 0) {
      applications.push(...page.services);
    }

    hasMorePages = pageNumber < page.numberOfPages;
    pageNumber += 1;
  }

  if (moveChildrenToParent) {
    applications.forEach((application) => {
      const parent = application.parentId ? applications.find(a => a.id === application.parentId) : undefined;
      if (parent) {
        parent.children = parent.children || [];
        parent.children.push(application);
      }
    });
  }

  const requiringNotification = applications.filter(a => condition(a));
  return requiringNotification;
};

const enqueue = async (queue, type, data) => {
  return new Promise((resolve, reject) => {
    const queuedJob = queue.create(type, data);
    queuedJob.save((err) => {
      if (err) {
        reject(err);
      } else {
        resolve(queuedJob.id);
      }
    });
  });
};

const forEachAsync = async (col, iteratee) => {
  for (let i = 0; i < col.length; i += 1) {
    await iteratee(col[i], i);
  }
};

module.exports = {
  getAllApplicationRequiringNotification,
  enqueue,
  forEachAsync,
};
