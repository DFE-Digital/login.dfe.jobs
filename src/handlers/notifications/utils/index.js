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

module.exports = {
  enqueue,
};
