const kue = require('login.dfe.kue');
const redisUrl = process.argv.redisUrl ? process.argv.redisUrl : 'redis://127.0.0.1:6379?db=1';

const getJob = () => {
  const job = {
    type: null,
    data: {}
  };

  process.argv.forEach((arg) => {
    if (arg.toLowerCase().startsWith('-type=')) {
      job.type = arg.substring(6);
    }
    else if (arg.toLowerCase().startsWith('-data=')) {
      const valueMatch = arg.substring(6).match(/(.+):(.+)/);
      if (!valueMatch) {
        throw new Error(`invalid data format - ${arg} does not match pattern -data=key:value`);
      }
      job.data[valueMatch[1]] = valueMatch[2]
    }
  });

  return job;
};

const queueJob = async () => {
  return new Promise((reject, resolve) => {
    try {
      const job = getJob();

      const queue = kue.createQueue({
        redis: redisUrl
      });
      const queuedJob = queue.create(job.type, job.data)
        .save((err) => {
          if (err) {
            reject(err);
          } else {
            resolve(queuedJob.id);
          }
        });
    } catch (e) {
      reject(e);
    }
  });
};

queueJob()
  .then((jobId) => {
    console.info(`Successfully queued job ${jobId}`);

    process.exit(0);
  })
  .catch((err) => {
    console.error(err);

    process.exit(0);
  });