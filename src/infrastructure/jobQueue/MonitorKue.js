const kue = require('login.dfe.kue');
const config = require('../config');
const logger = require('../logger');

const process = (job, processor, done) => {
  logger.info(`received job ${job.id} of type ${job.type}`);
  processor(job.data)
    .then(() => {
      logger.info(`successfully processed job ${job.id}`);
      done();
    })
    .catch((err) => {
      logger.error(`Error processing job ${job.id} - ${err.message}`);
      done(err);
    });
};

const getProcessorConcurrency = (type) => {
  if (!config.concurrency || !config.concurrency[type]) {
    return 1;
  }

  const concurrency = parseInt(config.concurrency[type], 10);
  if (isNaN(concurrency)) {
    throw new Error(`Invalid concurrency for ${type} (set to ${config.concurrency[type]}). Must be a number`);
  }
  return concurrency;
};

const getInactiveCount = async (queue, type) => new Promise((resolve, reject) => {
  const callback = (err, count) => {
    if (err) {
      return reject(err);
    }
    resolve(count);
  };
  if (type) {
    queue.inactiveCount(type, callback);
  } else {
    queue.inactiveCount(callback);
  }
});

const getActiveCount = async (queue, type) => new Promise((resolve, reject) => {
  const callback = (err, count) => {
    if (err) {
      return reject(err);
    }
    resolve(count);
  };
  if (type) {
    queue.activeCount(type, callback);
  } else {
    queue.activeCount(callback);
  }
});

const getFailedCount = async (queue, type) => new Promise((resolve, reject) => {
  const callback = (err, count) => {
    if (err) {
      return reject(err);
    }
    resolve(count);
  };
  if (type) {
    queue.failedCount(type, callback);
  } else {
    queue.failedCount(callback);
  }
});

const getCompleteCount = async (queue, type) => new Promise((resolve, reject) => {
  const callback = (err, count) => {
    if (err) {
      return reject(err);
    }
    resolve(count);
  };
  if (type) {
    queue.completeCount(type, callback);
  } else {
    queue.completeCount(callback);
  }
});

const getRangeOfJobs = async (offset, count, sort) => new Promise((resolve, reject) => {
  kue.Job.range(offset, count, sort, (err, jobs) => {
    if (err) {
      return reject(err);
    }
    resolve(jobs);
  });
});

const getRangeOfJobsOfType = async (type, offset, count, sort, numberInactive, numberActive, numberFailed, numberComplete) => {
  const takeFromState = async (state, stateCount, skipped, required) => {
    const stateOffset = skipped > offset ? 0 : offset - skipped;
    if (stateOffset < stateCount) {
      let takeFromState = stateCount - stateOffset;
      if (takeFromState > required) {
        takeFromState = required;
      }
      return new Promise((resolve, reject) => {
        kue.Job.rangeByType(type, state, stateOffset, takeFromState, sort, (err, jobs) => {
          if (err) {
            return reject(err);
          }
          resolve(jobs);
        });
      });
    }
    return Promise.resolve([]);
  };

  let skipped = 0;
  const jobs = [];

  if (jobs.length < count) {
    const stateJobs = await takeFromState('inactive', numberInactive, skipped, count - jobs.length);
    jobs.push(...stateJobs);
    skipped += numberInactive;
  }

  if (jobs.length < count) {
    const stateJobs = await takeFromState('active', numberActive, skipped, count - jobs.length);
    jobs.push(...stateJobs);
    skipped += numberActive;
  }

  if (jobs.length < count) {
    const stateJobs = await takeFromState('failed', numberFailed, skipped, count - jobs.length);
    jobs.push(...stateJobs);
    skipped += numberFailed;
  }

  if (jobs.length < count) {
    const stateJobs = await takeFromState('complete', numberComplete, skipped, count - jobs.length);
    jobs.push(...stateJobs);
    // skipped += numberComplete;
  }

  return jobs;
};

class MonitorKue {
  constructor(processorMapping) {
    this.processorMapping = processorMapping;

    this.status = 'stopped';
  }

  get currentStatus() {
    return this.status;
  }

  start() {
    const connectionString = (config.queueStorage && config.queueStorage.connectionString) ? config.queueStorage.connectionString : 'redis://127.0.0.1:6379';

    this.queue = kue.createQueue({
      redis: connectionString,
    });

    this.queue.on('error', (e) => {
      logger.warn('MonitorKue: An error occured in queue.on', { message: e.message, stack: e.stack });
    });

    this.queue.watchStuckJobs(10000);

    this.processorMapping.forEach((mapping) => {
      const concurrency = getProcessorConcurrency(mapping.type);
      if (concurrency > 0) {
        logger.debug(`MonitorKue: start monitoring ${mapping.type} with concurrency of ${concurrency}`);

        this.queue.process(mapping.type, concurrency, (job, done) => {
          process(job, mapping.processor, done);
        });
      } else {
        logger.info(`MonitorKue: No starting monitoring ${mapping.type} as concurrency is ${concurrency} (disabled)`);
      }
    });

    this.status = 'started';
  }

  async stop() {
    return new Promise((resolve, reject) => {
      try {
        this.queue.shutdown(5000, (err) => {
          if (err) {
            reject(err);
          } else {
            this.status = 'stopped';
            logger.info('MonitorKue: stopped');
            resolve();
          }
        });
      } catch (e) {
        reject(e);
      }
    });
  }

  getJobTypes() {
    return this.processorMapping.map((mapping) => mapping.type);
  }

  async getJobs(page, pageSize, type = undefined) {
    const offset = (page - 1) * pageSize;

    const inactive = await getInactiveCount(this.queue, type);
    const active = await getActiveCount(this.queue, type);
    const failed = await getFailedCount(this.queue, type);
    const complete = await getCompleteCount(this.queue, type);
    const jobs = type ? await getRangeOfJobsOfType(type, offset, pageSize, 'asc', inactive, active, failed, complete)
      : await getRangeOfJobs(offset, pageSize, 'asc');
    const numberOfJobs = inactive + active + failed + complete;
    const numberOfPages = Math.ceil(numberOfJobs / pageSize);
    return {
      jobs,
      numberOfPages,
      numberOfJobs,
      counts: {
        inactive,
        active,
        failed,
        complete,
      },
    };
  }

  async getJob(id) {
    return new Promise((resolve, reject) => {
      kue.Job.get(id, (err, job) => {
        if (err) {
          if (err.message.match(/job "\d*" doesnt exist/)) {
            return resolve(undefined);
          }
          return reject(err);
        }
        resolve(job);
      });
    });
  }
}

module.exports = MonitorKue;
