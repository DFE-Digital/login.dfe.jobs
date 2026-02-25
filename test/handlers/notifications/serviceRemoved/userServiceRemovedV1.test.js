jest.mock("../../../../src/infrastructure/notify");
jest.mock("../../../../src/infrastructure/jobQueue/BullHelpers");
jest.mock("login.dfe.api-client/users");

const { getNotifyAdapter } = require("../../../../src/infrastructure/notify");
const {
  bullEnqueue,
} = require("../../../../src/infrastructure/jobQueue/BullHelpers");
const { getUserRaw } = require("login.dfe.api-client/users");
const {
  getHandler,
} = require("../../../../src/handlers/notifications/serviceRemoved/userServiceRemovedV1");

const config = {
  notifications: {
    helpUrl: "https://help.dfe.signin",
    servicesUrl: "https://services.dfe.signin",
  },
};

const jobData = {
  firstName: "name",
  lastName: "lastname",
  serviceName: "Service 1",
  orgName: "mock-org",
  email: "user.one@unit.test",
};

describe("When handling user service removed v1 job", () => {
  const mockSendEmail = jest.fn();
  const mockBullEnqueue = jest.fn();
  const mockGetUserRaw = jest.fn();
  const mockLogger = {
    warn: jest.fn(),
    error: jest.fn(),
  };

  beforeEach(() => {
    mockSendEmail.mockReset();
    mockBullEnqueue.mockReset();
    mockGetUserRaw.mockReset();
    mockLogger.warn.mockReset();
    mockLogger.error.mockReset();

    getNotifyAdapter.mockReset();
    getNotifyAdapter.mockReturnValue({ sendEmail: mockSendEmail });
    bullEnqueue.mockImplementation(mockBullEnqueue);
    getUserRaw.mockImplementation(mockGetUserRaw);
  });

  it("should return a handler with a processor", async () => {
    const handler = getHandler(config);

    expect(handler).not.toBeNull();
    expect(handler.type).toBe("userserviceremoved_v1");
    expect(handler.processor).not.toBeNull();
    expect(handler.processor).toBeInstanceOf(Function);
  });

  it("should get email adapter with supplied config", async () => {
    const handler = getHandler(config, mockLogger);

    await handler.processor(jobData);

    expect(getNotifyAdapter).toHaveBeenCalledTimes(1);
    expect(getNotifyAdapter).toHaveBeenCalledWith(config);
    expect(mockSendEmail).toHaveBeenCalledTimes(1);
  });

  it("should send email with userServiceRemoved template", async () => {
    const handler = getHandler(config, mockLogger);

    await handler.processor(jobData);

    expect(mockSendEmail).toHaveBeenCalledTimes(1);
    expect(mockSendEmail).toHaveBeenCalledWith(
      "userServiceRemoved",
      expect.anything(),
      expect.anything(),
    );
  });

  it("should send email to users email address", async () => {
    const handler = getHandler(config, mockLogger);

    await handler.processor(jobData);

    expect(mockSendEmail).toHaveBeenCalledTimes(1);
    expect(mockSendEmail).toHaveBeenCalledWith(
      expect.anything(),
      jobData.email,
      expect.objectContaining({
        personalisation: expect.objectContaining({
          firstName: jobData.firstName,
          lastName: jobData.lastName,
          serviceName: jobData.serviceName,
          orgName: jobData.orgName,
          signInUrl: `${config.notifications.servicesUrl}`,
          helpUrl: `${config.notifications.helpUrl}/contact-us`,
        }),
      }),
    );
  });

  describe("User update notification", () => {
    it("should fetch user by email to get sub", async () => {
      mockGetUserRaw.mockResolvedValue({ sub: "user-sub-123" });
      const handler = getHandler(config, mockLogger);

      await handler.processor(jobData);

      expect(mockGetUserRaw).toHaveBeenCalledTimes(1);
      expect(mockGetUserRaw).toHaveBeenCalledWith({
        by: { email: jobData.email },
      });
    });

    it("should enqueue userupdated_v1 job when user with sub is found", async () => {
      mockGetUserRaw.mockResolvedValue({ sub: "user-sub-123" });
      const handler = getHandler(config, mockLogger);

      await handler.processor(jobData);

      expect(mockBullEnqueue).toHaveBeenCalledTimes(1);
      expect(mockBullEnqueue).toHaveBeenCalledWith("userupdated_v1", {
        sub: "user-sub-123",
      });
    });

    it("should not enqueue job when user does not have sub property", async () => {
      mockGetUserRaw.mockResolvedValue({ name: "John Doe" });
      const handler = getHandler(config, mockLogger);

      await handler.processor(jobData);

      expect(mockBullEnqueue).not.toHaveBeenCalled();
      expect(mockLogger.warn).toHaveBeenCalledTimes(1);
      expect(mockLogger.warn).toHaveBeenCalledWith(
        "Could not resolve user by email for update notification",
        { email: jobData.email },
      );
    });

    it("should log warning when user is not found", async () => {
      mockGetUserRaw.mockResolvedValue(null);
      const handler = getHandler(config, mockLogger);

      await handler.processor(jobData);

      expect(mockBullEnqueue).not.toHaveBeenCalled();
      expect(mockLogger.warn).toHaveBeenCalledTimes(1);
      expect(mockLogger.warn).toHaveBeenCalledWith(
        "Could not resolve user by email for update notification",
        { email: jobData.email },
      );
    });

    it("should not enqueue job when user is undefined", async () => {
      mockGetUserRaw.mockResolvedValue(undefined);
      const handler = getHandler(config, mockLogger);

      await handler.processor(jobData);

      expect(mockBullEnqueue).not.toHaveBeenCalled();
      expect(mockLogger.warn).toHaveBeenCalledTimes(1);
    });
  });

  describe("Error handling", () => {
    it("should log error when getUserRaw throws", async () => {
      const error = new Error("API connection failed");
      mockGetUserRaw.mockRejectedValue(error);
      const handler = getHandler(config, mockLogger);

      await handler.processor(jobData);

      expect(mockLogger.error).toHaveBeenCalledTimes(1);
      expect(mockLogger.error).toHaveBeenCalledWith(
        "Failed to enqueue userupdated_v1 after service removal",
        {
          error: { message: error.message, stack: error.stack },
        },
      );
    });

    it("should log error when bullEnqueue throws", async () => {
      const error = new Error("Queue connection failed");
      mockGetUserRaw.mockResolvedValue({ sub: "user-sub-123" });
      mockBullEnqueue.mockRejectedValue(error);
      const handler = getHandler(config, mockLogger);

      await handler.processor(jobData);

      expect(mockLogger.error).toHaveBeenCalledTimes(1);
      expect(mockLogger.error).toHaveBeenCalledWith(
        "Failed to enqueue userupdated_v1 after service removal",
        {
          error: { message: error.message, stack: error.stack },
        },
      );
    });

    it("should still send email even if user lookup fails", async () => {
      mockGetUserRaw.mockRejectedValue(new Error("API error"));
      const handler = getHandler(config, mockLogger);

      await handler.processor(jobData);

      expect(mockSendEmail).toHaveBeenCalledTimes(1);
    });

    it("should continue without logger if logger is not provided", async () => {
      mockGetUserRaw.mockResolvedValue(null);
      const handler = getHandler(config);

      // Should not throw
      await handler.processor(jobData);

      expect(mockSendEmail).toHaveBeenCalledTimes(1);
    });
  });
});
