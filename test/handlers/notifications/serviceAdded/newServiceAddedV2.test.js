jest.mock("../../../../src/infrastructure/notify");
const { getNotifyAdapter } = require("../../../../src/infrastructure/notify");
const {
  getHandler,
} = require("../../../../src/handlers/notifications/serviceAdded/newServiceAddedV2");

const config = {
  notifications: {
    servicesUrl: "https://services.dfe.signin",
    helpUrl: "https://help.dfe.signin",
  },
};

const data = {
  email: "user.one@unit.test",
  firstName: "mock-firstName",
  lastName: "mock-lastName",
  orgName: "mock-orgName",
  serviceName: "mock-serviceName",
  requestedSubServices: ["mock-requestedSubServices-role1"],
  signInUrl: "https://services.dfe.signin/my-services",
};

const endUserData = {
  ...data,
  ...{
    email: "mock-end-user-data-email",
    permission: { id: 0, name: "End user" },
  },
};
const approverUserData = {
  ...data,
  ...{
    email: "mock-approver-user-data-email",
    permission: { id: 10000, name: "Approver" },
  },
};

describe("when processing a userserviceadded_v2 job", () => {
  const mockSendEmail = jest.fn();

  beforeEach(() => {
    mockSendEmail.mockReset();

    getNotifyAdapter.mockReset();
    getNotifyAdapter.mockReturnValue({ sendEmail: mockSendEmail });
  });

  it("should return a handler with a processor", async () => {
    const handler = getHandler(config);

    expect(handler).not.toBeNull();
    expect(handler.type).toBe("userserviceadded_v2");
    expect(handler.processor).not.toBeNull();
    expect(handler.processor).toBeInstanceOf(Function);
  });

  it("should get email adapter with supplied config", async () => {
    const handler = getHandler(config);

    await handler.processor(endUserData);

    expect(getNotifyAdapter).toHaveBeenCalledTimes(1);
    expect(getNotifyAdapter).toHaveBeenCalledWith(config);
  });

  it("should send email with expected template", async () => {
    const handler = getHandler(config);

    await handler.processor(endUserData);

    expect(mockSendEmail).toHaveBeenCalledTimes(1);
    expect(mockSendEmail).toHaveBeenCalledWith(
      "userRequestForServiceApprovedV2",
      expect.anything(),
      expect.anything(),
    );
  });

  it("should send email to users email address", async () => {
    const handler = getHandler(config);

    await handler.processor(endUserData);

    expect(mockSendEmail).toHaveBeenCalledTimes(1);
    expect(mockSendEmail).toHaveBeenCalledWith(
      expect.anything(),
      endUserData.email,
      expect.anything(),
    );
  });

  it("should send email with expected personalisation data where permissions is provided (end-user)", async () => {
    const handler = getHandler(config);

    await handler.processor(endUserData);

    expect(mockSendEmail).toHaveBeenCalledTimes(1);
    expect(mockSendEmail).toHaveBeenCalledWith(
      expect.anything(),
      endUserData.email,
      expect.objectContaining({
        personalisation: expect.objectContaining({
          firstName: endUserData.firstName,
          lastName: endUserData.lastName,
          orgName: endUserData.orgName,
          permissionName: "End user",
          serviceName: endUserData.serviceName,
          subServices: endUserData.requestedSubServices,
          isApprover: false,
          signInUrl: `${config.notifications.servicesUrl}/my-services`,
        }),
      }),
    );
  });

  it("should send email with expected personalisation data where permissions is provided (approver)", async () => {
    const handler = getHandler(config);

    await handler.processor(approverUserData);

    expect(mockSendEmail).toHaveBeenCalledTimes(1);
    expect(mockSendEmail).toHaveBeenCalledWith(
      expect.anything(),
      approverUserData.email,
      expect.objectContaining({
        personalisation: expect.objectContaining({
          firstName: approverUserData.firstName,
          lastName: approverUserData.lastName,
          orgName: approverUserData.orgName,
          permissionName: "Approver",
          serviceName: approverUserData.serviceName,
          subServices: approverUserData.requestedSubServices,
          isApprover: true,
          signInUrl: `${config.notifications.servicesUrl}/my-services`,
        }),
      }),
    );
  });

  it("should send email with expected personalisation data where permissions is not provided", async () => {
    const handler = getHandler(config);

    await handler.processor(data);

    expect(mockSendEmail).toHaveBeenCalledTimes(1);
    expect(mockSendEmail).toHaveBeenCalledWith(
      expect.anything(),
      expect.anything(),
      expect.objectContaining({
        personalisation: expect.objectContaining({
          firstName: approverUserData.firstName,
          lastName: approverUserData.lastName,
          orgName: approverUserData.orgName,
          permissionName: "n/a",
          serviceName: approverUserData.serviceName,
          subServices: approverUserData.requestedSubServices,
          isApprover: false,
          signInUrl: `${config.notifications.servicesUrl}/my-services`,
          helpUrl: `${config.notifications.helpUrl}/contact`,
        }),
      }),
    );
  });
});
