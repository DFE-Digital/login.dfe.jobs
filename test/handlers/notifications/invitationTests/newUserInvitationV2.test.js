jest.mock("../../../../src/infrastructure/notify");

const { getNotifyAdapter } = require("../../../../src/infrastructure/notify");
const {
  getHandler,
} = require("../../../../src/handlers/notifications/invite/newUserInvitationV2");

const { getLoggerMock } = require("../../../utils");
const logger = getLoggerMock();

const config = {
  notifications: {
    profileUrl: "https://profile.test/reg",
    helpUrl: "https://help.test",
  },
};
const commonJobData = {
  firstName: "User",
  lastName: "One",
  email: "user.one@unit.tests",
  invitationId: "59205751-c229-4924-8acb-61a7d5edfa33",
};

describe("when sending v2 user invitation", () => {
  const mockSendEmail = jest.fn();

  beforeEach(() => {
    mockSendEmail.mockReset();

    getNotifyAdapter.mockReset();
    getNotifyAdapter.mockReturnValue({ sendEmail: mockSendEmail });
  });

  it("should return a handler with a processor", () => {
    const handler = getHandler(config);

    expect(handler).not.toBeNull();
    expect(handler.type).toBe("invitation_v2");
    expect(handler.processor).not.toBeNull();
    expect(handler.processor).toBeInstanceOf(Function);
  });

  it("should get email adapter with supplied config", async () => {
    const handler = getHandler(config);

    await handler.processor(commonJobData);

    expect(getNotifyAdapter).toHaveBeenCalledTimes(1);
    expect(getNotifyAdapter).toHaveBeenCalledWith(config);
  });

  it("should log an error message if an exception occurs", async () => {
    mockSendEmail.mockImplementation(() => {
      const error = new Error("Server Error");
      error.statusCode = 500;
      throw error;
    });
    getNotifyAdapter.mockReturnValue({ sendEmail: mockSendEmail });

    const handler = getHandler(config, logger);

    await expect(handler.processor(commonJobData)).rejects.toThrow(
      'Failed to process and send the email for type invitation_v2 - {"statusCode":500}',
    );
    expect(logger.error).toHaveBeenCalledTimes(1);
    expect(logger.error).toHaveBeenCalledWith(
      'Failed to process and send the email for type invitation_v2- {"statusCode":500}',
    );
  });
});
