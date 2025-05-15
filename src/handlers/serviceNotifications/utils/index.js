const { getPaginatedServicesRaw } = require("login.dfe.api-client/services");

const getAllApplicationRequiringNotification = async (
  config,
  condition,
  correlationId,
  moveChildrenToParent = false,
) => {
  let pageNumber = 1;
  let hasMorePages = true;
  let applications = [];
  while (hasMorePages) {
    const page = await getPaginatedServicesRaw({ pageSize: 100, pageNumber });

    if (page.services && page.services.length > 0) {
      applications.push(...page.services);
    }

    hasMorePages = pageNumber < page.numberOfPages;
    pageNumber += 1;
  }

  if (moveChildrenToParent) {
    applications.forEach((application) => {
      const parent = application.parentId
        ? applications.find((a) => a.id === application.parentId)
        : undefined;
      if (parent) {
        parent.children = parent.children || [];
        parent.children.push(application);
      }
    });
  }

  const requiringNotification = applications.filter((a) => condition(a));
  return requiringNotification;
};

module.exports = {
  getAllApplicationRequiringNotification,
};
