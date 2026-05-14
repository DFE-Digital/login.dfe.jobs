jest.mock("../../../../src/infrastructure/notify");

const { getNotifyAdapter } = require("../../../../src/infrastructure/notify");
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
  const mockLogger = {
    warn: jest.fn(),
    error: jest.fn(),
  };

  beforeEach(() => {
    mockSendEmail.mockReset();

    getNotifyAdapter.mockReset();
    getNotifyAdapter.mockReturnValue({ sendEmail: mockSendEmail });
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
});
