const listJobTypes = async (req, res) => {
  const jobTypes = req.monitor.getJobTypes();
  return res.json(jobTypes);
};
module.exports = listJobTypes;
