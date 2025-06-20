const { Worker } = require("bullmq");
const MonitorBull = require("../../../src/infrastructure/jobQueue/MonitorBull");
const logger = require("../../../src/infrastructure/logger/index");

jest.mock("bullmq", () => ({
  Worker: jest.fn().mockImplementation(() => ({
    close: jest.fn(),
  })),
}));

jest.mock("../../../src/infrastructure/logger", () => ({
  info: jest.fn(),
  error: jest.fn(),
  debug: jest.fn(),
}));

jest.mock("../../../src/infrastructure/config", () => ({
  queueStorage: {
    connectionString: "",
  },
}));

describe("MonitorBull", () => {
  const mappings = [
    {
      type: "test",
      processor: (jobData) => {
        logger.info(`Test job - ${JSON.stringify(jobData)}`);
        return Promise.resolve();
      },
    },
    {
      type: "test2",
      limiter: {
        max: 45,
        duration: 300000,
      },
      processor: (jobData) => {
        logger.info(`Test2 job - ${JSON.stringify(jobData)}`);
        return Promise.resolve();
      },
    },
  ];

  it("should construct a new MonitorBull", async () => {
    const bullInstance = new MonitorBull(mappings);
    expect(bullInstance.currentStatus).toBe("stopped");
  });

  it("should start monitoring the mappings when started", async () => {
    const bullInstance = new MonitorBull(mappings);
    bullInstance.start();
    expect(bullInstance.currentStatus).toBe("started");
    expect(Worker).toHaveBeenCalledWith("test", expect.any(Function), {
      connection: { url: "redis://127.0.0.1:6379" },
    });
    expect(logger.debug).toHaveBeenCalledWith(
      'MonitorBull: start monitoring handler "test"',
    );
    expect(logger.debug).toHaveBeenCalledWith(
      "MonitorBull: start monitoring test2 (with policy max: 45 duration: 300000)",
    );
  });

  it("should stop monitoring the mappings when stopped", async () => {
    const bullInstance = new MonitorBull(mappings);
    bullInstance.start();
    await bullInstance.stop();
    expect(bullInstance.currentStatus).toBe("stopped");
    expect(logger.info).toHaveBeenCalledWith("MonitorBull: stopped");
  });
});
