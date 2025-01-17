const processor = async () => {
  return Promise.resolve();
};
const config = {
  notifications: {
    type: "disk",
    helpUrl: "https://help.com",
  },
};
const logger = {
  info: jest.fn(),
  error: jest.fn(),
};

describe("when registering subServiceRequestActioned handlers", () => {
  let subServiceRequestApproved;
  let subServiceRequestRejected;
  let register;

  beforeAll(() => {
    subServiceRequestApproved = require("../../../../src/handlers/notifications/subServiceRequestActioned/subServiceRequestApproved");
    subServiceRequestApproved.getHandler = jest.fn().mockReturnValue({
      type: "sub_service_request_approved",
      processor,
    });

    subServiceRequestRejected = require("../../../../src/handlers/notifications/subServiceRequestActioned/subServiceRequestRejected");
    subServiceRequestRejected.getHandler = jest.fn().mockReturnValue({
      type: "sub_service_request_rejected",
      processor,
    });

    register =
      require("../../../../src/handlers/notifications/subServiceRequestActioned").register;
  });

  it("then it should register the sub_service_request_approved handler", async () => {
    const actual = await register(config, logger);
    const handler = actual.find(
      (x) => x.type === "sub_service_request_approved",
    );

    expect(subServiceRequestApproved.getHandler.mock.calls.length).toBe(1);
    expect(subServiceRequestApproved.getHandler.mock.calls[0][0]).toBe(config);
    expect(subServiceRequestApproved.getHandler.mock.calls[0][1]).toBe(logger);

    expect(handler).toBeDefined();
  });

  it("then it should register the sub_service_request_rejected handler", async () => {
    const actual = await register(config, logger);
    const handler = actual.find(
      (x) => x.type === "sub_service_request_rejected",
    );

    expect(subServiceRequestRejected.getHandler.mock.calls.length).toBe(1);
    expect(subServiceRequestRejected.getHandler.mock.calls[0][0]).toBe(config);
    expect(subServiceRequestRejected.getHandler.mock.calls[0][1]).toBe(logger);

    expect(handler).toBeDefined();
  });
});
