jest.mock("../../../../src/infrastructure/jobs");

jest.mock("login.dfe.api-client/users", () => ({
  getUserRaw: jest.fn(),
  addOrganisationToUser: jest.fn(),
}));

jest.mock("login.dfe.api-client/invitations", () => ({
  getInvitationRaw: jest.fn(),
  updateInvitation: jest.fn(),
  createInvitation: jest.fn(),
  addOrganisationToInvitation: jest.fn(),
}));

jest.mock("../../../../src/infrastructure/config", () => ({
  queueStorage: {
    connectionString: "mockConnectionString",
  },
}));

const jobs = {
  queueNotifyRelyingParty: jest.fn(),
};
const JobsClient = require("../../../../src/infrastructure/jobs");
const {
  getUserRaw,
  addOrganisationToUser,
} = require("login.dfe.api-client/users");
const {
  getHandler,
} = require("../../../../src/handlers/publicApi/invite/publicInvitationRequestV1");
const {
  updateInvitation,
  createInvitation,
  getInvitationRaw,
  addOrganisationToInvitation,
} = require("login.dfe.api-client/invitations");

const config = {
  queueStorage: {
    connectionString: "",
  },
  publicApi: {
    directories: {},
    organisations: {},
  },
};
const logger = {
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};
const existingUser = {
  sub: "user1",
};
const existingInvitation = {
  id: "invite1",
  callbacks: [{ sourceId: "test1", callbackUri: "http://source2/users/" }],
};

describe("when handling a public invitation request (v1)", () => {
  let handler;
  let data;

  beforeEach(() => {
    data = {
      firstName: "User",
      lastName: "One",
      email: "user.one@unit.test",
      organisation: "org1",
      sourceId: "firstuser",
      callback: "http://source/callback",
      userRedirect: "http://source/reg/complete",
      clientId: "clientone",
      state: "EXISTING_USER",
    };
    getUserRaw.mockReset();
    getInvitationRaw.mockReset();
    addOrganisationToInvitation.mockReset();
    createInvitation.mockReset().mockResolvedValue({
      id: "new-invite",
    });
    updateInvitation.mockReset();

    jobs.queueNotifyRelyingParty.mockReset();
    JobsClient.mockReset().mockImplementation(() => {
      return jobs;
    });

    handler = getHandler(config, logger);
  });

  it("and a user already exists, then it should add org to user if org specified", async () => {
    getUserRaw.mockResolvedValue(existingUser);
    await handler.processor(data);

    expect(addOrganisationToUser).toHaveBeenCalledTimes(1);
    expect(addOrganisationToUser).toHaveBeenCalledWith({
      organisationId: "org1",
      roleId: 0,
      userId: "user1",
    });
  });

  it("and a user already exists, then it should not attempt to add org to user if org not specified", async () => {
    getUserRaw.mockResolvedValue(existingUser);
    data.organisation = undefined;

    await handler.processor(data);

    expect(addOrganisationToUser).toHaveBeenCalledTimes(0);
  });

  it("and a user already exists, then it should notify the relying party that the users is active", async () => {
    getUserRaw.mockResolvedValue(existingUser);
    await handler.processor(data);

    expect(jobs.queueNotifyRelyingParty).toHaveBeenCalledTimes(1);
    expect(jobs.queueNotifyRelyingParty).toHaveBeenCalledWith(
      data.callback,
      existingUser.sub,
      data.sourceId,
      data.state,
      "clientone",
    );
  });

  it("and a user already exists, then it should not check for existing invitation or create a new one", async () => {
    getUserRaw.mockResolvedValue(existingUser);
    await handler.processor(data);

    expect(getInvitationRaw).toHaveBeenCalledTimes(0);
    expect(updateInvitation).toHaveBeenCalledTimes(0);
    expect(createInvitation).toHaveBeenCalledTimes(0);
  });

  it("and an invitation already exists, then it should update invitation to include callback", async () => {
    getInvitationRaw.mockReturnValue(existingInvitation);

    await handler.processor(data);

    expect(updateInvitation).toHaveBeenCalledTimes(1);
    expect(updateInvitation.mock.calls[0][0]).toMatchObject({
      id: "invite1",
      callbacks: [
        { sourceId: "test1", callbackUri: "http://source2/users/" },
        { sourceId: data.sourceId, callbackUri: data.callback },
      ],
    });
  });

  it("and an invitation already exists, then it should add org to invitation if org specified", async () => {
    getInvitationRaw.mockReturnValue(existingInvitation);

    await handler.processor(data);

    expect(addOrganisationToInvitation).toHaveBeenCalledTimes(1);
    expect(addOrganisationToInvitation).toHaveBeenCalledWith({
      invitationId: "invite1",
      organisationId: "org1",
      roleId: 0,
    });
  });

  it("and an invitation already exists, then it should not attempt to add invitation to user if org not specified", async () => {
    getInvitationRaw.mockReturnValue(existingInvitation);
    data.organisation = undefined;

    await handler.processor(data);

    expect(addOrganisationToInvitation).toHaveBeenCalledTimes(0);
  });

  it("and an invitation already exists, then it should not create a new one", async () => {
    getUserRaw.mockResolvedValue(existingUser);
    await handler.processor(data);

    expect(createInvitation).toHaveBeenCalledTimes(0);
  });

  it("and the user is new to the system, then it should create a new invitation", async () => {
    await handler.processor(data);

    expect(createInvitation).toHaveBeenCalledTimes(1);
    expect(createInvitation.mock.calls[0][0]).toMatchObject({
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email,
      selfStarted: false,
      callbacks: [
        {
          sourceId: data.sourceId,
          callbackUri: data.callback,
        },
      ],
    });
  });

  it("and the user is new to the system, then it should add organisations to invitation if organisation present", async () => {
    await handler.processor(data);

    expect(addOrganisationToInvitation).toHaveBeenCalledTimes(1);
    expect(addOrganisationToInvitation).toHaveBeenCalledWith({
      invitationId: "new-invite",
      organisationId: "org1",
      roleId: 0,
    });
  });

  it("and the user is new to the system, then it should not attempt to add organisations to invitation if organisation not present", async () => {
    data.organisation = undefined;

    await handler.processor(data);

    expect(addOrganisationToInvitation).toHaveBeenCalledTimes(0);
  });
});
