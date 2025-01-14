jest.mock(
  "../../../../src/handlers/serviceNotifications/users/userUpdatedHandlerV1",
);
jest.mock(
  "../../../../src/handlers/serviceNotifications/users/sendWSUserUpdatedV1",
);
jest.mock("../../../../src/handlers/serviceNotifications/utils");

const {
  mockHandler,
  getDefaultConfig,
  getLoggerMock,
} = require("../testUtils");
const {
  getAllApplicationRequiringNotification,
} = require("../../../../src/handlers/serviceNotifications/utils");
const userUpdatedHandlerV1 = require("../../../../src/handlers/serviceNotifications/users/userUpdatedHandlerV1");
const sendWSUserUpdatedV1 = require("../../../../src/handlers/serviceNotifications/users/sendWSUserUpdatedV1");
const {
  register,
} = require("../../../../src/handlers/serviceNotifications/users");

const config = getDefaultConfig();
const logger = getLoggerMock();
const applications = [{ id: "application-1" }, { id: "application-2" }];
const userUpdatedHandlerV1Instance = mockHandler("userupdated_v1");
const sendWSUserUpdatedV1App1Instance = mockHandler("sendwsuserupdated_v1");
const sendWSUserUpdatedV1App2Instance = mockHandler("sendwsuserupdated_v1");
const correlationId = Date.now();

describe("when registering user handlers", () => {
  beforeEach(() => {
    getAllApplicationRequiringNotification
      .mockReset()
      .mockReturnValue(applications);

    userUpdatedHandlerV1.getHandler
      .mockReset()
      .mockReturnValue(userUpdatedHandlerV1Instance);

    sendWSUserUpdatedV1.getHandler
      .mockReset()
      .mockImplementation((config, logger, application) => {
        if (application === applications[0]) {
          return sendWSUserUpdatedV1App1Instance;
        } else if (application === applications[1]) {
          return sendWSUserUpdatedV1App2Instance;
        }
        return undefined;
      });
  });

  it("then it should register user updated handler", async () => {
    const actual = await register(config, logger, correlationId);

    expect(actual).toBeInstanceOf(Array);
    expect(actual.length).toBeGreaterThanOrEqual(1);
    expect(actual).toContain(userUpdatedHandlerV1Instance);
    expect(userUpdatedHandlerV1.getHandler).toHaveBeenCalledTimes(1);
    expect(userUpdatedHandlerV1.getHandler).toHaveBeenCalledWith(
      config,
      logger,
    );
  });

  it("then it should register send ws user updated handler for each application that requires notification", async () => {
    const actual = await register(config, logger, correlationId);

    expect(actual).toBeInstanceOf(Array);
    expect(actual.length).toBeGreaterThanOrEqual(2);
    expect(actual).toContain(sendWSUserUpdatedV1App1Instance);
    expect(actual).toContain(sendWSUserUpdatedV1App2Instance);
    expect(sendWSUserUpdatedV1.getHandler).toHaveBeenCalledTimes(2);
    expect(sendWSUserUpdatedV1.getHandler).toHaveBeenCalledWith(
      config,
      logger,
      applications[0],
    );
    expect(sendWSUserUpdatedV1.getHandler).toHaveBeenCalledWith(
      config,
      logger,
      applications[1],
    );
  });
});
