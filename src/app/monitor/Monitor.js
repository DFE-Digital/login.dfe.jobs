const config = require('./../../infrastructure/config');
const logger = require('./../../infrastructure/logger');
const kue = require('kue');

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
}

module.exports = Monitor;
