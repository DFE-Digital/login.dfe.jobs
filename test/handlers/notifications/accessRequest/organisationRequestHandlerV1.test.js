jest.mock("login.dfe.api-client/users", () => ({
  getUserRaw: jest.fn(),
  getUsersRaw: jest.fn(),
  getUserOrganisationRequestRaw: jest.fn(),
}));
jest.mock("login.dfe.api-client/organisations", () => ({
  getOrganisationRaw: jest.fn(),
  getOrganisationApprovers: jest.fn(),
}));
jest.mock("login.dfe.dao", () => ({
  directories: {
    getAllActiveUsersFromList(v) {
      if (v[0] === "appover1") {
        return ["appover1"];
      }
      return [];
    },
  },
}));
jest.mock("../../../../src/infrastructure/config", () => ({}));

const mockClose = jest.fn();
const mockAdd = jest.fn();

const {
  bullQueueTtl,
} = require("../../../../src/infrastructure/jobQueue/BullHelpers");

jest.mock("bullmq", () => ({
  Queue: jest.fn().mockImplementation(() => ({
    close: mockClose,
    add: mockAdd,
  })),
}));

const { Queue } = require("bullmq");
const { getDefaultConfig, getLoggerMock } = require("../../../utils");

const {
  getUserRaw,
  getUsersRaw,
  getUserOrganisationRequestRaw,
} = require("login.dfe.api-client/users");

const {
  getOrganisationRaw,
  getOrganisationApprovers,
} = require("login.dfe.api-client/organisations");

const {
  getHandler,
} = require("../../../../src/handlers/notifications/accessRequest/organisationRequestHanderV1");

const config = getDefaultConfig();
const logger = getLoggerMock();

const data = {
  requestId: "requestId",
};

describe("when handling organisationrequest_v1 job", () => {
  beforeEach(() => {
    getUserOrganisationRequestRaw.mockReturnValue({
      id: "requestId",
      user_id: "user1",
      org_id: "org1",
      reason: "I need access pls",
    });
    getOrganisationApprovers.mockReturnValue([]);
    getOrganisationRaw.mockReturnValue({
      id: "org1",
      name: "organisation name",
    });
    getUserRaw.mockResolvedValue({
      sub: "user1",
      email: "user.one-fromdir@unit.tests",
      given_name: "name",
      family_name: "surname",
      status: 2,
    });
    getUsersRaw.mockResolvedValue([]);
  });

  it("then it should return handler with correct type", () => {
    const handler = getHandler(config, logger);
    expect(handler.type).toBe("organisationrequest_v1");
  });

  it("then it should create queue with correct connectionString", async () => {
    const handler = getHandler(config, logger);
    await handler.processor(data);
    expect(Queue).toHaveBeenCalledTimes(1);
    expect(Queue).toHaveBeenCalledWith("supportrequest_v1", {
      connection: { url: "redis://127.0.0.1:6379" },
    });
  });

  it("then it should get the request by id", async () => {
    const handler = getHandler(config, logger);
    await handler.processor(data);
    expect(getUserOrganisationRequestRaw).toHaveBeenCalledTimes(1);
    expect(getUserOrganisationRequestRaw).toHaveBeenCalledWith({
      by: { userOrganisationRequestId: "requestId" },
    });
  });

  it("then it should get the approvers for the org in the request", async () => {
    const handler = getHandler(config, logger);
    await handler.processor(data);
    expect(getOrganisationApprovers).toHaveBeenCalledTimes(1);
    expect(getOrganisationApprovers).toHaveBeenCalledWith({
      organisationId: "org1",
    });
  });

  it("then it should get the org details", async () => {
    const handler = getHandler(config, logger);
    await handler.processor(data);
    expect(getOrganisationRaw).toHaveBeenCalledTimes(1);
    expect(getOrganisationRaw).toHaveBeenCalledWith({
      by: { organisationId: "org1" },
    });
  });

  it("then it should get the user details", async () => {
    const handler = getHandler(config, logger);
    await handler.processor(data);
    expect(getUserRaw).toHaveBeenCalledTimes(1);
    expect(getUserRaw).toHaveBeenCalledWith({ by: { id: "user1" } });
  });

  it("then it should queue a supportrequest_v1 job if no approvers for org ", async () => {
    const handler = getHandler(config, logger);
    await handler.processor(data);
    expect(Queue).toHaveBeenCalledTimes(1);
    expect(mockClose).toHaveBeenCalledTimes(1);
    expect(mockAdd).toHaveBeenCalledTimes(1);
    expect(mockAdd).toHaveBeenCalledWith(
      "supportrequest_v1",
      {
        email: "user.one-fromdir@unit.tests",
        name: "name surname",
        orgName: "organisation name",
        type: "Access to an organisation",
        urn: "",
        message:
          "Organisation request for organisation name, no approvers exist. Request reason: I need access pls",
      },
      bullQueueTtl,
    );
  });

  it("then it should queue a approveraccessrequest_v1 job if approvers for org ", async () => {
    getOrganisationApprovers.mockReturnValue(["appover1"]);
    getUsersRaw.mockResolvedValue([
      {
        id: "approver1",
        email: "approver@email.com",
        given_name: "John",
        family_name: "Doe",
      },
    ]);
    const handler = getHandler(config, logger);
    await handler.processor(data);
    expect(Queue).toHaveBeenCalledTimes(1);
    expect(mockClose).toHaveBeenCalledTimes(1);
    expect(mockAdd).toHaveBeenCalledWith(
      "approveraccessrequest_v1",
      {
        userEmail: "user.one-fromdir@unit.tests",
        userName: "name surname",
        recipients: [
          {
            email: "approver@email.com",
            firstName: "John",
            lastName: "Doe",
          },
        ],
        orgId: "org1",
        orgName: "organisation name",
        requestId: "requestId",
      },
      bullQueueTtl,
    );
  });
});
