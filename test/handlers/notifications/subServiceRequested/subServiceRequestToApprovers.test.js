jest.mock("../../../../src/infrastructure/notify");
jest.mock("login.dfe.api-client/users", () => ({
  getUsersRaw: jest.fn(),
  getUserOrganisationRequestRaw: jest.fn(),
}));
jest.mock("login.dfe.api-client/organisations", () => ({
  getOrganisationApprovers: jest.fn(),
}));

jest.mock("login.dfe.dao", () => ({
  directories: {
    getAllActiveUsersFromList() {
      return [1];
    },
  },
}));
const {
  getOrganisationApprovers,
} = require("login.dfe.api-client/organisations");
const {
  getUsersRaw,
  getUserOrganisationRequestRaw,
} = require("login.dfe.api-client/users");
const { getNotifyAdapter } = require("../../../../src/infrastructure/notify");
const {
  getHandler,
} = require("../../../../src/handlers/notifications/subServiceRequested/subServiceRequestToApprovers");

const config = {
  notifications: {
    helpUrl: "https://help.dfe.com",
  },
};

const data = {
  senderFirstName: "Jane",
  senderLastName: "Doe",
  orgId: "OrgansiationID-123456",
  orgName: "Test Organisation",
  serviceName: "Test ServiceName",
  requestedSubServices: ["test-sub-service"],
  rejectUrl: "https://example.com/reject",
  approveUrl: "https://example.com/approve",
  helpUrl: "https://help.example.com",
};

describe("when processing a sub_service_request_to_approvers job", () => {
  const mockSendEmail = jest.fn();

  beforeEach(() => {
    mockSendEmail.mockReset();

    getNotifyAdapter.mockReset();
    getNotifyAdapter.mockReturnValue({ sendEmail: mockSendEmail });

    getUserOrganisationRequestRaw.mockReturnValue({
      id: "requestId",
      user_id: "user1",
      org_id: "org1",
      reason: "I need access pls",
    });
    getOrganisationApprovers.mockReturnValue(["appover1"]);

    getUsersRaw.mockResolvedValue([
      {
        id: "approver1",
        email: "approver1@email.com",
        given_name: "Test1",
        family_name: "User1",
      },
      {
        id: "approver2",
        email: "approver2@email.com",
        given_name: "Test2",
        family_name: "User2",
      },
    ]);
  });

  it("should return a handler with a processor", () => {
    const handler = getHandler(config);

    expect(handler).not.toBeNull();
    expect(handler.type).toBe("sub_service_request_to_approvers");
    expect(handler.processor).not.toBeNull();
    expect(handler.processor).toBeInstanceOf(Function);
  });

  it("should get email adapter with supplied config", async () => {
    const handler = getHandler(config);

    await handler.processor(data);

    expect(getNotifyAdapter).toHaveBeenCalledTimes(1);
    expect(getNotifyAdapter).toHaveBeenCalledWith(config);
  });

  it("should send email with expected template for each approver", async () => {
    const handler = getHandler(config);

    await handler.processor(data);

    expect(mockSendEmail).toHaveBeenCalledTimes(2);
    expect(mockSendEmail).toHaveBeenCalledWith(
      "userRequestToApproverForSubServiceAccess",
      expect.anything(),
      expect.anything(),
    );
  });

  it("should send email to each approver email address", async () => {
    const handler = getHandler(config);

    await handler.processor(data);

    expect(mockSendEmail).toHaveBeenNthCalledWith(
      1,
      expect.anything(),
      "approver1@email.com",
      expect.anything(),
    );
    expect(mockSendEmail).toHaveBeenNthCalledWith(
      2,
      expect.anything(),
      "approver2@email.com",
      expect.anything(),
    );
  });

  it("should send email to each approver with expected personalisation data", async () => {
    const handler = getHandler(config);

    await handler.processor(data);

    expect(mockSendEmail).toHaveBeenNthCalledWith(
      1,
      expect.anything(),
      expect.anything(),
      expect.objectContaining({
        personalisation: expect.objectContaining({
          firstName: "Test1",
          lastName: "User1",
          orgName: "Test Organisation",
          senderName: "Jane Doe",
          serviceName: "Test ServiceName",
          requestedSubServices: ["test-sub-service"],
          approveUrl: "https://example.com/approve",
          rejectUrl: "https://example.com/reject",
          helpUrl: "https://help.example.com",
          contactUsUrl: `${config.notifications.helpUrl}/contact-us`,
        }),
      }),
    );

    expect(mockSendEmail).toHaveBeenNthCalledWith(
      2,
      expect.anything(),
      expect.anything(),
      expect.objectContaining({
        personalisation: expect.objectContaining({
          firstName: "Test2",
          lastName: "User2",
          orgName: "Test Organisation",
          senderName: "Jane Doe",
          serviceName: "Test ServiceName",
          requestedSubServices: ["test-sub-service"],
          approveUrl: "https://example.com/approve",
          rejectUrl: "https://example.com/reject",
          helpUrl: "https://help.example.com",
          contactUsUrl: `${config.notifications.helpUrl}/contact-us`,
        }),
      }),
    );
  });

  it("should personalises email correctly when no sub services have been selected", async () => {
    const handler = getHandler(config);

    await handler.processor({
      ...data,
      requestedSubServices: [],
    });

    expect(mockSendEmail).toHaveBeenCalledWith(
      expect.anything(),
      expect.anything(),
      expect.objectContaining({
        personalisation: expect.objectContaining({
          requestedSubServices: ["No roles selected."],
        }),
      }),
    );
  });
});
