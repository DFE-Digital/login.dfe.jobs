const { Queue } = require("bullmq");

jest.mock("../../../src/infrastructure/config", () => ({
  queueStorage: {
    connectionString: "mockConnectionString",
  },
}));

const mockClose = jest.fn();
const mockAdd = jest.fn();

jest.mock("bullmq", () => ({
  Queue: jest.fn().mockImplementation(() => ({
    close: mockClose,
    add: mockAdd,
  })),
}));

const {
  bullEnqueue,
  bullQueueTtl,
  bullConnectionUrl,
} = require("../../../src/infrastructure/jobQueue/BullHelpers");

describe("MonitorBullHelpers", () => {
  it("should create the required connectionString", async () => {
    expect(bullConnectionUrl).toBe("mockConnectionString");
  });

  it("should call bullEnqueue with the correct template and connection", async () => {
    await bullEnqueue("mockTemplate", { name: "mockName" });
    expect(Queue).toHaveBeenCalledWith("mockTemplate", {
      connection: { url: "mockConnectionString" },
    });
  });

  it("should call add when dispatching a job", async () => {
    await bullEnqueue("mockTemplate", { name: "mockName" });
    expect(mockAdd).toHaveBeenCalledWith(
      "mockTemplate",
      { name: "mockName" },
      bullQueueTtl,
    );
  });

  it("should call close finished dispatching a job", async () => {
    await bullEnqueue("mockTemplate", { name: "mockName" });
    expect(mockClose).toHaveBeenCalledTimes(1);
  });
});
