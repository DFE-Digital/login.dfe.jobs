const config = require('./../config');
const logger = require('./../logger');
const kue = require('kue');
const { promisify } = require('util');

const getProcessorConcurrency = (type) => {
  if (!config.concurrency || !config.concurrency[type]) {
    return 1;
  }

  const concurrency = parseInt(config.concurrency[type]);
  if (isNaN(concurrency)) {
    throw new Error(`Invalid concurrency for ${type} (set to ${config.concurrency[type]}). Must be a number`);
  }
  return concurrency;
};

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

const getInactiveCount = async (queue) => {
  return new Promise((resolve, reject) => {
    queue.inactiveCount((err, count) => {
      if (err) {
        return reject(err);
      }
      resolve(count);
    });
  });
};
const getActiveCount = async (queue) => {
  return new Promise((resolve, reject) => {
    queue.activeCount((err, count) => {
      if (err) {
        return reject(err);
      }
      resolve(count);
    });
  });
};
const getFailedCount = async (queue) => {
  return new Promise((resolve, reject) => {
    queue.failedCount((err, count) => {
      if (err) {
        return reject(err);
      }
      resolve(count);
    });
  });
};
const getCompleteCount = async (queue) => {
  return new Promise((resolve, reject) => {
    queue.completeCount((err, count) => {
      if (err) {
        return reject(err);
      }
      resolve(count);
    });
  });
};
const getRangeOfJobs = async (offset, count, sort) => {
  return new Promise((resolve, reject) => {
    kue.Job.range(offset, count, sort, (err, jobs) => {
      if (err) {
        return reject(err);
      }
      resolve(jobs);
    });
  });
};

class Monitor {
  constructor(processorMapping) {
    this.processorMapping = processorMapping;

    this.status = 'stopped';
  }

  get currentStatus() {
    return this.status;
  }

  start() {
    let connectionString = (config.queueStorage && config.queueStorage.connectionString) ? config.queueStorage.connectionString : 'redis://127.0.0.1:6379';
    this.queue = kue.createQueue({
      redis: connectionString
    });
    this.queue.on('error', (e) => {
      logger.warn(`An error occured in the monitor queue - ${e.message}`, e);
    });
    this.queue.watchStuckJobs(10000);

    this.processorMapping.forEach((mapping) => {
      const concurrency = getProcessorConcurrency(mapping.type);
      if (concurrency > 0) {
        logger.info(`start monitoring ${mapping.type} with concurrency of ${concurrency}`);
        this.queue.process(mapping.type, concurrency, (job, done) => {
          process(job, mapping.processor, done);
        });
      } else {
        logger.info(`No starting monitoring ${mapping.type} as concurrency is ${concurrency} (disabled)`);
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
            resolve();
          }
        });
      } catch (e) {
        reject(e);
      }
    });
  }

  getJobTypes() {
    return this.processorMapping.map(mapping => mapping.type);
  }

  async getJobs(page, pageSize) {
    const offset = (page - 1) * pageSize;

    const inactive = await getInactiveCount(this.queue);
    const active = await getActiveCount(this.queue);
    const failed = await getFailedCount(this.queue);
    const complete = await getCompleteCount(this.queue);
    const jobs = await getRangeOfJobs(offset, pageSize, 'asc');
    const numberOfJobs = inactive;
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
}

module.exports = Monitor;
