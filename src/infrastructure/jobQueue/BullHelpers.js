const config = require("../config");
const { Queue } = require("bullmq");

const bullConnectionUrl =
  config.queueStorage && config.queueStorage.connectionString
    ? config.queueStorage.connectionString
    : "redis://127.0.0.1:6379";

const bullQueueTtl = {
  removeOnComplete: {
    age: 3600, // keep up to 1 hour
    count: 50, // keep up to 50 jobs
  },
  removeOnFail: {
    age: 12 * 3600, // keep up to 12 hours
  },
};

const getTypedBullQueue = (type) =>
  new Queue(type, {
    connection: { url: bullConnectionUrl },
  });

// Use bullEnqueue when sending a single data
// payload.  This will establish a queue and send the data.
const bullEnqueue = async (type, data) => {
  let queue = null;
  try {
    queue = getTypedBullQueue(type);
    await queue.add(type, data, bullQueueTtl);
  } finally {
    if (queue) {
      await queue.close();
    }
  }
};

module.exports = {
  bullQueueTtl,
  bullConnectionUrl,
  bullEnqueue,
};
