const { Worker } = require("bullmq");
const logger = require("../logger");
const { bullConnectionUrl } = require("./BullHelpers");
const { logWithCorrelationContext } = require("login.dfe.api-client/logging");

const process = async (job, processor) => {
  const meta = { handler: job.name, jobId: job.id };
  try {
    logger.info(
      `MonitorBull: received job "${job.id}" for handler "${job.name}"`,
      meta,
    );
    await processor(job.data);
    logger.info(`MonitorBull: processed job "${job.id}"`, meta);
  } catch (err) {
    logger.error(`MonitorBull: Error processing job "${job.id}"`, {
      ...meta,
      ...{ error: { message: err.message, stack: err.stack } },
    });
    await job.moveToFailed({ message: err.message, stack: err.stack }, false);
  }
};

class MonitorBull {
  constructor(processorMapping) {
    this.processorMapping = processorMapping;
    this.workers = [];
    this.status = "stopped";
  }

  get currentStatus() {
    return this.status;
  }

  start() {
    // Closely matches Kue which "creates" a worker per "mapping.type"
    this.processorMapping.forEach((mapping) => {
      logger.debug(`MonitorBull: start monitoring handler "${mapping.type}"`);
      const worker = new Worker(
        mapping.type,
        async (job) => {
          await logWithCorrelationContext(mapping.type, () =>
            process(job, mapping.processor),
          );
        },
        { connection: { url: bullConnectionUrl } },
      );
      this.workers.push(worker);
    });

    this.status = "started";
  }

  // Stop all registered workers https://docs.bullmq.io/guide/workers/graceful-shutdown
  async stop() {
    try {
      const stoppers = this.workers.map((worker) => worker.close());
      await Promise.all(stoppers);
      this.status = "stopped";
      logger.info("MonitorBull: stopped");
    } catch (err) {
      logger.error("MonitorBull: failed stop signal", {
        error: { message: err.message, stack: err.stack },
      });
    }
  }
}

module.exports = MonitorBull;
