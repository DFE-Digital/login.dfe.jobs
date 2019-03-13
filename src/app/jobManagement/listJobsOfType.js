const { getQueryIntValueOrDefault } = require('./../../utils');

const listJobsOfType = async (req, res) => {
  const pageNumber = getQueryIntValueOrDefault(req, 'page', 1);
  if (!pageNumber) {
    return res.status(400).json({
      reasons: ['page query value is not a valid number'],
    });
  }
  const pageSize = getQueryIntValueOrDefault(req, 'pageSize', 100);
  if (!pageSize) {
    return res.status(400).json({
      reasons: ['pageSize query value is not a valid number'],
    });
  }
  const availableJobTypes = req.monitor.getJobTypes();
  const jobType = availableJobTypes.find(t => t.toLowerCase() === req.params.type.toLowerCase());
  if (!jobType) {
    return res.status(400).json({
      reasons: [`job type ${req.params.type} is not known`],
    });
  }

  const page = await req.monitor.getJobs(pageNumber, pageSize, jobType);

  const content = JSON.stringify({
    jobs: page.jobs,
    numberOfPages: page.numberOfPages,
    numberOfJobs: page.numberOfJobs,
  });
  res.set({
    'content-type': 'application/json',
    'content-length': content.length,
    'x-count-inactive': page.counts.inactive,
    'x-count-active': page.counts.active,
    'x-count-complete': page.counts.complete,
    'x-count-failed': page.counts.failed,
  });
  return res.send(req.method === 'HEAD' ? undefined : content);
};
module.exports = listJobsOfType;
