const listJobs = async (req, res) => {
  const jobTypes = req.monitor.getJobTypes();
  return res.json(jobTypes);
};
module.exports = listJobs;
