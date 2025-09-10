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
      return [
        {
          sub: "approver-1",
          email: "approver-1@email.com",
        },
        {
          sub: "approver-2",
          email: "approver-2@email.com",
        },
      ];
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
} = require("../../../../src/handlers/notifications/accessRequest/organisationRequestOutcomeToApprovers");

const config = {
  notifications: {
    servicesUrl: "https://services.dfe.signin",
    helpUrl: "https://help.dfe.signin",
  },
};

const jobData = {
  approverUserId: "approver-2",
  endUserEmail: "end-user-email@test.com",
  endUserName: "End User",
  organisationId: "org-id-1",
  orgName: "Test Organisation",
  approved: true,
  reason: null,
};

const logger = {
  info: jest.fn(),
  error: jest.fn(),
};

describe("when processing a organisationRequestOutcomeToApprovers job", () => {
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
    getOrganisationApprovers.mockReturnValue(["approver-1", "approver-2"]);

    // Simulate approver-1 being filtered out as it would be in the code.
    getUsersRaw.mockResolvedValue([
      {
        id: "approver-2",
        email: "approver2@email.com",
        given_name: "Test2",
        family_name: "User2",
      },
    ]);
  });

  it("should return a handler with a processor", async () => {
    const handler = getHandler(config, logger);

    expect(handler).not.toBeNull();
    expect(handler.type).toBe("organisation_request_outcome_to_approvers");
    expect(handler.processor).not.toBeNull();
    expect(handler.processor).toBeInstanceOf(Function);
  });

  it("should get email adapter with supplied config", async () => {
    const handler = getHandler(config, logger);

    await handler.processor(jobData);

    expect(getNotifyAdapter).toHaveBeenCalledTimes(1);
    expect(getNotifyAdapter).toHaveBeenCalledWith(config);

    expect(mockSendEmail).toHaveBeenCalledTimes(1);
    expect(mockSendEmail).toHaveBeenCalledWith(
      "userRequestForOrganisationAccessApprovedToApprovers",
      expect.anything(),
      expect.anything(),
    );
  });

  it("should send email with expected template, when the request is not approved", async () => {
    const handler = getHandler(config, logger);

    const data = { ...jobData, ...{ approved: false } };
    await handler.processor(data);

    expect(mockSendEmail).toHaveBeenCalledTimes(1);
    expect(mockSendEmail).toHaveBeenCalledWith(
      "userRequestForOrganisationAccessRejectedToApprovers",
      expect.anything(),
      expect.anything(),
    );
  });

  it("should send email with users email address and expected personalisation data when the request is approved", async () => {
    const handler = getHandler(config, logger);

    await handler.processor(jobData);

    expect(mockSendEmail).toHaveBeenCalledTimes(1);
    expect(mockSendEmail).toHaveBeenCalledWith(
      expect.anything(),
      "approver2@email.com",
      expect.objectContaining({
        personalisation: expect.objectContaining({
          approverFirstName: "Test2",
          approverLastName: "User2",
          endUserName: jobData.endUserName,
          endUserEmail: jobData.endUserEmail,
          orgName: jobData.orgName,
          showReasonHeader: false,
          reason: "",
          helpUrl: `${config.notifications.helpUrl}/contact-us`,
        }),
      }),
    );
  });

  // it.each([
  //   [true, null, "", false],
  //   [true, undefined, "", false],
  //   [true, "", "", false],
  //   [true, " ", "", false],
  //   [false, null, "", false],
  //   [false, undefined, "", false],
  //   [false, "", "", false],
  //   [false, " ", "", false],
  // ])(
  //   'should send an email with expected personalisation data, when the request approval is %s and the reason is "%s"',
  //   async (
  //     approved,
  //     reasonText,
  //     expectedReasonText,
  //     expectedShowReasonHeader,
  //   ) => {
  //     const handler = getHandler(config, logger);
  //     const data = { ...jobData, ...{ approved, reasonText } };
  //     await handler.processor(data);

  //     expect(mockSendEmail).toHaveBeenCalledTimes(1);
  //     expect(mockSendEmail).toHaveBeenCalledWith(
  //       expect.anything(),
  //       expect.anything(),
  //       expect.objectContaining({
  //         personalisation: expect.objectContaining({
  //           name: jobData.name,
  //           orgName: jobData.orgName,
  //           showReasonHeader: expectedShowReasonHeader,
  //           reason: expectedReasonText,
  //           servicesUrl: config.notifications.servicesUrl,
  //           helpUrl: `${config.notifications.helpUrl}/contact-us`,
  //         }),
  //       }),
  //     );
  //   },
  // );
});
