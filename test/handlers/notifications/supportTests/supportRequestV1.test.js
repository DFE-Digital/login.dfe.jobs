jest.mock("../../../../src/infrastructure/email");

const { getEmailAdapter } = require("../../../../src/infrastructure/email");
const {
  getHandler,
} = require("../../../../src/handlers/notifications/support/supportRequestV1");
const emailSend = jest.fn();

const config = {
  notifications: {
    supportEmailAddress: "support@unit.tests",
  },
};
const logger = {};
const jobData = {
  name: "User One",
  email: "user.one@unit.tests",
  orgName: "org1",
  urn: "1234",
  message: "I am having issues signing in using my new details",
  service: "Service Name",
  type: "other",
  typeAdditionalInfo: "type of issue",
};

describe("When handling supportrequest_v1 job", () => {
  beforeEach(() => {
    emailSend.mockReset();

    getEmailAdapter.mockReset();
    getEmailAdapter.mockReturnValue({ send: emailSend });
  });

  it("then it should return a handler with a processor", () => {
    const handler = getHandler(config, logger);

    expect(handler).not.toBeNull();
    expect(handler.type).toBe("supportrequest_v1");
    expect(handler.processor).not.toBeNull();
    expect(handler.processor).toBeInstanceOf(Function);
  });

  it("then it should get email adapter with supplied config and logger", async () => {
    const handler = getHandler(config, logger);

    await handler.processor(jobData);

    expect(getEmailAdapter.mock.calls).toHaveLength(1);
    expect(getEmailAdapter.mock.calls[0][0]).toBe(config);
    expect(getEmailAdapter.mock.calls[0][1]).toBe(logger);
  });

  it("then it should send email to support email address", async () => {
    const handler = getHandler(config, logger);

    await handler.processor(jobData);

    expect(emailSend.mock.calls).toHaveLength(1);
    expect(emailSend.mock.calls[0][0]).toBe(
      config.notifications.supportEmailAddress,
    );
  });

  it("then it should send email using support-request template", async () => {
    const handler = getHandler(config, logger);

    await handler.processor(jobData);

    expect(emailSend.mock.calls).toHaveLength(1);
    expect(emailSend.mock.calls[0][1]).toBe("support-request");
  });

  it("then it should send email using request data as model", async () => {
    const handler = getHandler(config, logger);

    await handler.processor(jobData);

    expect(emailSend.mock.calls).toHaveLength(1);
    expect(emailSend.mock.calls[0][2]).toEqual({
      name: jobData.name,
      email: jobData.email,
      orgName: jobData.orgName,
      urn: jobData.urn,
      message: jobData.message,
      service: jobData.service,
      type: jobData.type,
      typeAdditionalInfo: jobData.typeAdditionalInfo,
    });
  });

  it("then it should send email with subject", async () => {
    const handler = getHandler(config, logger);

    await handler.processor(jobData);

    expect(emailSend.mock.calls).toHaveLength(1);
    expect(emailSend.mock.calls[0][3]).toBe("DfE Sign-in service desk request");
  });
});
