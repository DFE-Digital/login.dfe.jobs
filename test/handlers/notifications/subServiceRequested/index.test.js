jest.mock(
  "../../../../src/handlers/notifications/subServiceRequested/subServiceRequestToApprovers",
);
jest.mock("login.dfe.dao", () => ({
  directories: {
    getAllActiveUsersFromList() {
      return [1];
    },
  },
}));

const processor = async (data) => Promise.resolve();
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

describe("when registering sub-service request handler", () => {
  let subServiceRequested;
  let register;

  beforeAll(() => {
    subServiceRequested = require("../../../../src/handlers/notifications/subServiceRequested/subServiceRequestToApprovers");
    subServiceRequested.getHandler = jest.fn().mockReturnValue({
      type: "sub_service_request_to_approvers",
      processor,
    });

    register =
      require("../../../../src/handlers/notifications/subServiceRequested").register;
  });

  it("then it should register the sub_service_request_to_approvers handler", async () => {
    const actual = await register(config, logger);
    const handler = actual.find(
      (x) => x.type === "sub_service_request_to_approvers",
    );

    expect(subServiceRequested.getHandler.mock.calls.length).toBe(1);
    expect(subServiceRequested.getHandler.mock.calls[0][0]).toBe(config);
    expect(subServiceRequested.getHandler.mock.calls[0][1]).toBe(logger);

    expect(handler).toBeDefined();
  });
});
