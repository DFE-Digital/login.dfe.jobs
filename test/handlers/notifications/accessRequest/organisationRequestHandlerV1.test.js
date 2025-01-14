jest.mock("login.dfe.kue");
jest.mock("../../../../src/infrastructure/organisations");
jest.mock("../../../../src/infrastructure/directories");
jest.mock("../../../../src/handlers/notifications/utils");
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

const kue = require("login.dfe.kue");
const OrganisationsClient = require("../../../../src/infrastructure/organisations");
const DirectoriesClient = require("../../../../src/infrastructure/directories");
const { enqueue } = require("../../../../src/handlers/notifications/utils");
const {
  getDefaultConfig,
  getLoggerMock,
  getOrganisationsClientMock,
  getDirectoriesClientMock,
} = require("../../../utils");
const {
  getHandler,
} = require("../../../../src/handlers/notifications/accessRequest/organisationRequestHanderV1");

const config = getDefaultConfig();
const logger = getLoggerMock();

const data = {
  requestId: "requestId",
};
const queue = {};
const organisatonsClient = getOrganisationsClientMock();
const directoriesClient = getDirectoriesClientMock();

describe("when handling organisationrequest_v1 job", () => {
  beforeEach(() => {
    organisatonsClient.mockResetAll();
    organisatonsClient.getOrgRequestById.mockReturnValue({
      id: "requestId",
      user_id: "user1",
      org_id: "org1",
      reason: "I need access pls",
    });
    organisatonsClient.getApproversForOrganisation.mockReturnValue([]);
    organisatonsClient.getOrganisationById.mockReturnValue({
      id: "org1",
      name: "organisation name",
    });
    OrganisationsClient.mockImplementation(() => organisatonsClient);
    directoriesClient.mockResetAll();
    directoriesClient.getById.mockReturnValue({
      sub: "user1",
      email: "user.one-fromdir@unit.tests",
      given_name: "name",
      family_name: "surname",
      status: 2,
    });
    directoriesClient.getUsersByIds.mockReturnValue([]);
    DirectoriesClient.mockImplementation(() => directoriesClient);
    kue.createQueue.mockReset().mockReturnValue(queue);
    enqueue.mockReset();
  });

  it("then it should return handler with correct type", () => {
    const handler = getHandler(config, logger);
    expect(handler.type).toBe("organisationrequest_v1");
  });

  it("then it should create queue with correct connectionString", async () => {
    const handler = getHandler(config, logger);
    await handler.processor(data);
    expect(kue.createQueue).toHaveBeenCalledTimes(1);
    expect(kue.createQueue).toHaveBeenCalledWith({
      redis: config.queueStorage.connectionString,
    });
  });

  it("then it should get the request by id", async () => {
    const handler = getHandler(config, logger);
    await handler.processor(data);
    expect(organisatonsClient.getOrgRequestById).toHaveBeenCalledTimes(1);
    expect(organisatonsClient.getOrgRequestById.mock.calls[0][0]).toBe(
      "requestId",
    );
  });

  it("then it should get the approvers for the org in the request", async () => {
    const handler = getHandler(config, logger);
    await handler.processor(data);
    expect(
      organisatonsClient.getApproversForOrganisation,
    ).toHaveBeenCalledTimes(1);
    expect(
      organisatonsClient.getApproversForOrganisation.mock.calls[0][0],
    ).toBe("org1");
  });

  it("then it should get the org details", async () => {
    const handler = getHandler(config, logger);
    await handler.processor(data);
    expect(organisatonsClient.getOrganisationById).toHaveBeenCalledTimes(1);
    expect(organisatonsClient.getOrganisationById.mock.calls[0][0]).toBe(
      "org1",
    );
  });

  it("then it should get the user details", async () => {
    const handler = getHandler(config, logger);
    await handler.processor(data);
    expect(directoriesClient.getById).toHaveBeenCalledTimes(1);
    expect(directoriesClient.getById.mock.calls[0][0]).toBe("user1");
  });

  it("then it should queue a supportrequest_v1 job if no approvers for org ", async () => {
    const handler = getHandler(config, logger);
    await handler.processor(data);
    expect(enqueue).toHaveBeenCalledTimes(1);
    expect(enqueue).toHaveBeenCalledWith(queue, "supportrequest_v1", {
      email: "user.one-fromdir@unit.tests",
      name: "name surname",
      orgName: "organisation name",
      type: "Access to an organisation",
      urn: "",
      message:
        "Organisation request for organisation name, no approvers exist. Request reason: I need access pls",
    });
  });

  it("then it should queue a approveraccessrequest_v1 job if approvers for org ", async () => {
    organisatonsClient.getApproversForOrganisation.mockReturnValue([
      "appover1",
    ]);
    directoriesClient.getUsersByIds.mockReturnValue([
      {
        id: "approver1",
        email: "approver@email.com",
      },
    ]);
    const handler = getHandler(config, logger);
    await handler.processor(data);
    expect(enqueue).toHaveBeenCalledTimes(1);
    expect(enqueue).toHaveBeenCalledWith(queue, "approveraccessrequest_v1", {
      userEmail: "user.one-fromdir@unit.tests",
      userName: "name surname",
      recipients: ["approver@email.com"],
      orgId: "org1",
      orgName: "organisation name",
      requestId: "requestId",
    });
  });
});
