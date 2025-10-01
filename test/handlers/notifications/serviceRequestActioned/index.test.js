jest.mock(
  "../../../../src/handlers/notifications/serviceRequestActioned/serviceRequestOutcomeToApprovers",
);
jest.mock("../../../../src/infrastructure/config", () => ({}));
jest.mock("login.dfe.dao", () => ({
  directories: {
    getAllActiveUsersFromList() {
      return [1];
    },
  },
}));

const processor = async () => {
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
  let serviceRequestOutcomeToApprovers;
  let register;

  beforeAll(() => {
    serviceRequestOutcomeToApprovers = require("../../../../src/handlers/notifications/serviceRequestActioned/serviceRequestOutcomeToApprovers");
    serviceRequestOutcomeToApprovers.getHandler = jest.fn().mockReturnValue({
      type: "service_request_outcome_to_approvers",
      processor,
    });

    register =
      require("../../../../src/handlers/notifications/serviceRequestActioned").register;
  });

  it("then it should register the v1 handler", async () => {
    const actual = await register(config, logger);

    expect(serviceRequestOutcomeToApprovers.getHandler.mock.calls.length).toBe(
      1,
    );
    expect(serviceRequestOutcomeToApprovers.getHandler.mock.calls[0][0]).toBe(
      config,
    );
    expect(serviceRequestOutcomeToApprovers.getHandler.mock.calls[0][1]).toBe(
      logger,
    );

    const handler = actual.find(
      (x) => x.type === "serviceRequestOutcomeToApprovers",
    );
    expect(handler).not.toBeNull();
  });
});
