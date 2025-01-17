const kue = require("login.dfe.kue");
const config = require("../config");
const logger = require("../logger");

const process = (job, processor, done) => {
  logger.info(`MonitorKue: received job ${job.id} of type ${job.type}`);
  processor(job.data)
    .then(() => {
      logger.info(`MonitorKue: successfully processed job ${job.id}`);
      done();
    })
    .catch((err) => {
      logger.error(
        `MonitorKue: Error processing job ${job.id} - ${err.message}`,
      );
      done(err);
    });
};

const getProcessorConcurrency = (type) => {
  if (!config.concurrency || !config.concurrency[type]) {
    return 1;
  }

  const concurrency = parseInt(config.concurrency[type], 10);
  if (isNaN(concurrency)) {
    throw new Error(
      `MonitorKue: Invalid concurrency for ${type} (set to ${config.concurrency[type]}). Must be a number`,
    );
  }
  return concurrency;
};

class MonitorKue {
  constructor(processorMapping) {
    this.processorMapping = processorMapping;

    this.status = "stopped";
  }

  get currentStatus() {
    return this.status;
  }

  start() {
    const connectionString =
      config.queueStorage && config.queueStorage.connectionString
        ? config.queueStorage.connectionString
        : "redis://127.0.0.1:6379";

    this.queue = kue.createQueue({
      redis: connectionString,
    });

    this.queue.on("error", (e) => {
      logger.warn("MonitorKue: An error occured in queue.on", {
        message: e.message,
        stack: e.stack,
      });
    });

    this.queue.watchStuckJobs(10000);

    this.processorMapping.forEach((mapping) => {
      const concurrency = getProcessorConcurrency(mapping.type);
      if (concurrency > 0) {
        logger.debug(
          `MonitorKue: start monitoring ${mapping.type} with concurrency of ${concurrency}`,
        );

        this.queue.process(mapping.type, concurrency, (job, done) => {
          process(job, mapping.processor, done);
        });
      } else {
        logger.info(
          `MonitorKue: No starting monitoring ${mapping.type} as concurrency is ${concurrency} (disabled)`,
        );
      }
    });

    this.status = "started";
  }

  async stop() {
    return new Promise((resolve, reject) => {
      try {
        this.queue.shutdown(5000, (err) => {
          if (err) {
            reject(err);
          } else {
            this.status = "stopped";
            logger.info("MonitorKue: stopped");
            resolve();
          }
        });
      } catch (e) {
        reject(e);
      }
    });
  }
}

module.exports = MonitorKue;
