jest.mock(
  "../../../../src/handlers/notifications/accessRequest/accessRequestV1",
);
jest.mock("login.dfe.dao", () => ({
  directories: {
    getAllActiveUsersFromList() {
      return [1];
    },
  },
}));

const processor = async (data) => {
  return Promise.resolve();
};
const config = {
  notifications: {
    type: "disk",
  },
};
const logger = {
  info: jest.fn(),
  error: jest.fn(),
};

describe("when registering access request handlers", () => {
  let accessRequestV1;
  let register;

  beforeAll(() => {
    accessRequestV1 = require("../../../../src/handlers/notifications/accessRequest/accessRequestV1");
    accessRequestV1.getHandler = jest.fn().mockReturnValue({
      type: "accessRequestV1",
      processor,
    });

    register =
      require("../../../../src/handlers/notifications/accessRequest").register;
  });

  it("then it should register the v1 handler", async () => {
    const actual = await register(config, logger);

    expect(accessRequestV1.getHandler.mock.calls.length).toBe(1);
    expect(accessRequestV1.getHandler.mock.calls[0][0]).toBe(config);
    expect(accessRequestV1.getHandler.mock.calls[0][1]).toBe(logger);

    const handler = actual.find((x) => x.type === "accessRequestV1");
    expect(handler).not.toBeNull();
  });
});
