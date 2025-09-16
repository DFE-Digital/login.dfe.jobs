const { getDefaultConfig, getLoggerMock } = require("../testUtils");
const {
  getHandler,
} = require("../../../../src/handlers/serviceNotifications/roles/sendWSRoleUpdatedV1");

jest.mock("../../../../src/infrastructure/config/index", () => ({}));

const config = getDefaultConfig();
const logger = getLoggerMock();

const application = {
  id: "service1",
};

describe("when handling sendWSRoleUpdated_v1 job", () => {
  beforeEach(() => {});

  it("then it should return handler with correct type", () => {
    const handler = getHandler(config, logger, application);

    expect(handler.type).toBe("sendwsroleupdated_v1_service1");
  });
});
