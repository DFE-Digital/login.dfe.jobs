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
} = require("../../../../src/handlers/notifications/userOrganisation/removedUserFromOrgV1");

const config = {
  notifications: {
    helpUrl: "https://help.dfe.signin",
    servicesUrl: "https://services.dfe.signin",
  },
};

const jobData = {
  firstName: "name",
  lastName: "lastname",
  orgName: "mock-org",
  email: "user.one@unit.test",
};

describe("When handling user removed user from organisation v1 job", () => {
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
    expect(handler.type).toBe("userremovedfromorganisationrequest_v1");
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

  it("should send email with userRemovedFromOrganisation template", async () => {
    const handler = getHandler(config, mockLogger);

    await handler.processor(jobData);

    expect(mockSendEmail).toHaveBeenCalledTimes(1);
    expect(mockSendEmail).toHaveBeenCalledWith(
      "userRemovedFromOrganisation",
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
          orgName: jobData.orgName,
          signInUrl: `${config.notifications.servicesUrl}`,
          helpUrl: `${config.notifications.helpUrl}/contact-us`,
        }),
      }),
    );
  });

  describe("Error handling", () => {
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
