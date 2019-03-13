const getJob = async (req, res) => {
  const job = await req.monitor.getJob(req.params.id);
  if (!job) {
    return res.status(404).send();
  }
  return res.json(job);
};
module.exports = getJob;
