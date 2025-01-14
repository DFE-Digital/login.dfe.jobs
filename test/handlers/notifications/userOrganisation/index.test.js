jest.mock(
  "../../../../src/handlers/notifications/userOrganisation/exsitingUserAddedToOrgV1",
);
jest.mock(
  "../../../../src/handlers/notifications/userOrganisation/removedUserFromOrgV1",
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
  let exsitingUserAddedToOrgV1;
  let removedUserFromOrgV1;
  let register;

  beforeAll(() => {
    exsitingUserAddedToOrgV1 = require("../../../../src/handlers/notifications/userOrganisation/exsitingUserAddedToOrgV1");
    exsitingUserAddedToOrgV1.getHandler = jest.fn().mockReturnValue({
      type: "exsitingUserAddedToOrgV1",
      processor: async (data) => Promise.resolve(),
    });

    removedUserFromOrgV1 = require("../../../../src/handlers/notifications/userOrganisation/removedUserFromOrgV1");
    removedUserFromOrgV1.getHandler = jest.fn().mockReturnValue({
      type: "removedUserFromOrgV1",
      processor: async (data) => Promise.resolve(),
    });

    register =
      require("../../../../src/handlers/notifications/userOrganisation").register;
  });

  it("then it should register the exsitingUserAddedToOrgV1 handler", async () => {
    const actual = await register(config, logger);

    expect(exsitingUserAddedToOrgV1.getHandler.mock.calls.length).toBe(1);
    expect(exsitingUserAddedToOrgV1.getHandler.mock.calls[0][0]).toBe(config);
    expect(exsitingUserAddedToOrgV1.getHandler.mock.calls[0][1]).toBe(logger);

    const handler = actual.find((x) => x.type === "exsitingUserAddedToOrgV1");
    expect(handler).not.toBeNull();
  });

  it("then it should register the removedUserFromOrgV1 handler", async () => {
    const actual = await register(config, logger);

    expect(removedUserFromOrgV1.getHandler.mock.calls.length).toBe(1);
    expect(removedUserFromOrgV1.getHandler.mock.calls[0][0]).toBe(config);
    expect(removedUserFromOrgV1.getHandler.mock.calls[0][1]).toBe(logger);

    const handler = actual.find((x) => x.type === "removedUserFromOrgV1");
    expect(handler).not.toBeNull();
  });
});
