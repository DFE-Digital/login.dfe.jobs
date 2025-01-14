jest.mock(
  "../../../../src/handlers/notifications/serviceRemoved/userServiceRemovedV1",
);

const config = {
  notifications: {
    type: "disk",
  },
};
const logger = {
  info: jest.fn(),
  error: jest.fn(),
};

describe("when registering user organisation handlers", () => {
  let userServiceRemovedV1;
  let register;

  beforeAll(() => {
    userServiceRemovedV1 = require("../../../../src/handlers/notifications/serviceRemoved/userServiceRemovedV1");
    userServiceRemovedV1.getHandler = jest.fn().mockReturnValue({
      type: "userServiceRemovedV1",
      processor: async (data) => Promise.resolve(),
    });
    register =
      require("../../../../src/handlers/notifications/serviceRemoved").register;
  });

  it("then it should register the userServiceRemovedV1 handler", async () => {
    const actual = await register(config, logger);

    expect(userServiceRemovedV1.getHandler.mock.calls.length).toBe(1);
    expect(userServiceRemovedV1.getHandler.mock.calls[0][0]).toBe(config);
    expect(userServiceRemovedV1.getHandler.mock.calls[0][1]).toBe(logger);

    const handler = actual.find((x) => x.type === "userServiceRemovedV1");
    expect(handler).not.toBeNull();
  });
});
