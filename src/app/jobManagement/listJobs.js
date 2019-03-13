const listJobs = async (req, res) => {
  const page = await req.monitor.getJobs(1, 100);

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
    'x-count-completed': page.counts.completed,
    'x-count-failed': page.counts.failed,
  });
  return res.send(req.method === 'HEAD' ? undefined : content);
};
module.exports = listJobs;
