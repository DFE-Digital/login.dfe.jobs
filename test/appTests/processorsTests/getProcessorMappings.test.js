jest.mock("../../../src/handlers/notifications", () => ({}));
jest.mock("../../../src/handlers/serviceNotifications");
jest.mock("../../../src/infrastructure/config", () => ({}));
const { getProcessorMappings } = require("../../../src/handlers");

const config = {
  key: "value",
};
const logger = {
  info: () => {},
};

describe("when getting processor mappings", () => {
  let notificationsRegister;
  let serviceNotificationsRegister;

  beforeEach(() => {
    notificationsRegister = jest.fn().mockReturnValue([
      {
        type: "notifications1",
        processor: () => {},
      },
      {
        type: "notifications2",
        processor: () => {},
      },
    ]);
    const notifications = require("../../../src/handlers/notifications");
    notifications.register = notificationsRegister;

    serviceNotificationsRegister = jest.fn().mockReturnValue([
      {
        type: "servicenotifications1",
        processor: () => {},
      },
      {
        type: "servicenotifications2",
        processor: () => {},
      },
    ]);
    const serviceNotifications = require("../../../src/handlers/serviceNotifications");
    serviceNotifications.register = serviceNotificationsRegister;
  });

  it("then it should return an array of processors", async () => {
    const actual = await getProcessorMappings(config, logger);

    expect(actual).not.toBeNull();
    expect(actual).toBeDefined();
    expect(actual).toBeInstanceOf(Array);
  });

  it("then it should register test processor", async () => {
    const actual = await getProcessorMappings(config, logger);

    expect(actual.find((x) => x.type === "test")).toBeDefined();
  });

  it("then it should register notification processors", async () => {
    const actual = await getProcessorMappings(config, logger);

    expect(notificationsRegister.mock.calls.length).toBe(1);
    expect(notificationsRegister.mock.calls[0][0]).toBe(config);
    expect(notificationsRegister.mock.calls[0][1]).toBe(logger);
    expect(actual.find((x) => x.type === "notifications1")).toBeDefined();
    expect(actual.find((x) => x.type === "notifications2")).toBeDefined();
  });

  it("then it should register service notification processors", async () => {
    const actual = await getProcessorMappings(config, logger);

    expect(notificationsRegister.mock.calls.length).toBe(1);
    expect(notificationsRegister.mock.calls[0][0]).toBe(config);
    expect(notificationsRegister.mock.calls[0][1]).toBe(logger);
    expect(
      actual.find((x) => x.type === "servicenotifications1"),
    ).toBeDefined();
    expect(
      actual.find((x) => x.type === "servicenotifications2"),
    ).toBeDefined();
  });
});
