jest.mock("../../../../src/infrastructure/notify");
jest.mock("login.dfe.api-client/users", () => ({
  getUsersRaw: jest.fn(),
  getUserOrganisationRequestRaw: jest.fn(),
}));
jest.mock("login.dfe.api-client/organisations", () => ({
  getOrganisationApprovers: jest.fn(),
}));

let mockServiceRequestOutcomeToApprovers = [1];

jest.mock("login.dfe.dao", () => ({
  directories: {
    getAllActiveUsersFromList() {
      return mockServiceRequestOutcomeToApprovers;
    },
  },
}));

const {
  getUsersRaw,
  getUserOrganisationRequestRaw,
} = require("login.dfe.api-client/users");
const {
  getOrganisationApprovers,
} = require("login.dfe.api-client/organisations");
const { getNotifyAdapter } = require("../../../../src/infrastructure/notify");
const {
  getHandler,
} = require("../../../../src/handlers/notifications/serviceRequested/serviceRequestToApproversV2");

const config = {
  notifications: {},
};
const jobData = {
  senderName: "TestUser",
  senderEmail: "testuser1@test.com",
  orgId: "ABCDEFGH-XXXX-1234-BFCC-7D9CB120577A",
  orgName: "DSI TEST",
  requestedServiceName: "Subservice Test",
  requestedSubServices: ["RAISE Training Anon"],
  rejectServiceUrl: "https://example.com/reject",
  approveServiceUrl: "https://example.com/approve",
  helpUrl: "https://help.example.com",
};

describe("when processing a servicerequest_to_approvers_v2 job", () => {
  const mockSendEmail = jest.fn();

  beforeEach(() => {
    mockServiceRequestOutcomeToApprovers = [1];
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
    expect(handler.type).toBe("servicerequest_to_approvers_v2");
    expect(handler.processor).not.toBeNull();
    expect(handler.processor).toBeInstanceOf(Function);
  });

  it("should get email adapter with supplied config", async () => {
    const handler = getHandler(config);

    await handler.processor(jobData);

    expect(getNotifyAdapter).toHaveBeenCalledTimes(1);
    expect(getNotifyAdapter).toHaveBeenCalledWith(config);
  });

  it("should not send any emails if there are no approvers", async () => {
    mockServiceRequestOutcomeToApprovers = [];

    const handler = getHandler(config);

    await handler.processor(jobData);

    expect(mockSendEmail).toHaveBeenCalledTimes(0);
  });

  it("should send email with expected template for each approver", async () => {
    const handler = getHandler(config);

    await handler.processor(jobData);

    expect(mockSendEmail).toHaveBeenCalledTimes(2);
    expect(mockSendEmail).toHaveBeenCalledWith(
      "userRequestToApproverForServiceAccess",
      expect.anything(),
      expect.anything(),
    );
  });

  it("should send email to each approver email address", async () => {
    const handler = getHandler(config);

    await handler.processor(jobData);

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

    await handler.processor(jobData);

    expect(mockSendEmail).toHaveBeenNthCalledWith(
      1,
      expect.anything(),
      expect.anything(),
      expect.objectContaining({
        personalisation: expect.objectContaining({
          firstName: "Test1",
          lastName: "User1",
          orgName: "DSI TEST",
          senderName: "TestUser",
          senderEmail: "testuser1@test.com",
          requestedServiceName: "Subservice Test",
          requestedSubServices: ["RAISE Training Anon"],
          approveServiceUrl: "https://example.com/approve",
          rejectServiceUrl: "https://example.com/reject",
          helpUrl: "https://help.example.com",
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
          orgName: "DSI TEST",
          senderName: "TestUser",
          senderEmail: "testuser1@test.com",
          requestedServiceName: "Subservice Test",
          requestedSubServices: ["RAISE Training Anon"],
          approveServiceUrl: "https://example.com/approve",
          rejectServiceUrl: "https://example.com/reject",
          helpUrl: "https://help.example.com",
        }),
      }),
    );
  });

  it("should personalises email correctly when no sub services have been selected", async () => {
    const handler = getHandler(config);

    await handler.processor({
      ...jobData,
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
