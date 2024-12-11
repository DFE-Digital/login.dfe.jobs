const { Worker } = require('bullmq');
const config = require('../config');
const logger = require('../logger');

const process = async (job, processor) => {
  try {
    logger.info(`MonitorBull: received job ${job.id} of type ${job.name}`);
    await processor(job.data);
    logger.info(`MonitorBull: processed job ${job.id}`);
  } catch (err) {
    logger.error(`MonitorBull: Error processing job ${job.id}`, { job: { name: job.name, id: job.id }, error: { message: err.message, stack: err.stack } });
    await job.moveToFailed({ message: err.message, stack: err.stack }, false);
  }
};

class MonitorBull {
  constructor(processorMapping) {
    this.processorMapping = processorMapping;
    this.workers = [];
    this.status = 'stopped';
  }

  get currentStatus() {
    return this.status;
  }

  start() {
    const connectionString = (config.queueStorage && config.queueStorage.connectionString) ? config.queueStorage.connectionString : 'redis://127.0.0.1:6379';

    // Closely matches Kue which "creates" a worker per "mapping.type"
    this.processorMapping.forEach((mapping) => {
      logger.debug(`MonitorBull: start monitoring ${mapping.type}`);
      const worker = new Worker(mapping.type, async (job) => { process(job, mapping.processor); }, { connection: { url: connectionString } });
      this.workers.push(worker);
    });

    this.status = 'started';
  }

  // Stop all registered workers https://docs.bullmq.io/guide/workers/graceful-shutdown
  async stop() {
    try {
      const stoppers = this.workers.map((worker) => worker.close());
      await Promise.all(stoppers);
      this.status = 'stopped';
      logger.info('MonitorBull: stopped');
    } catch (err) {
      logger.error('MonitorBull: failed stop signal', { error: { message: err.message, stack: err.stack } });
    }
  }
}

module.exports = MonitorBull;
