jest.mock("../../../../src/infrastructure/directories");
jest.mock("../../../../src/infrastructure/organisations");
jest.mock("../../../../src/infrastructure/jobs");

jest.mock("login.dfe.api-client/users", () => ({
  getUserRaw: jest.fn(),
}));

jest.mock("login.dfe.api-client/invitations", () => ({
  getInvitation: jest.fn(),
  createInvitation: jest.fn(),
}));

jest.mock("../../../../src/infrastructure/config", () => ({
  queueStorage: {
    connectionString: "mockConnectionString",
  },
}));

const directories = {
  updateInvitation: jest.fn(),
};
const DirectoriesClient = require("../../../../src/infrastructure/directories");

const organisations = {
  addOrganisationToInvitation: jest.fn(),
  addOrganisationToUser: jest.fn(),
};
const OrganisationsClient = require("../../../../src/infrastructure/organisations");

const jobs = {
  queueNotifyRelyingParty: jest.fn(),
};
const JobsClient = require("../../../../src/infrastructure/jobs");
const { getUserRaw } = require("login.dfe.api-client/users");
const {
  getHandler,
} = require("../../../../src/handlers/publicApi/invite/publicInvitationRequestV1");
const {
  getInvitation,
  createInvitation,
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
  callbacks: [{ sourceId: "test1", callback: "http://source2/users/" }],
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
    getInvitation.mockReset();
    createInvitation.mockReset().mockResolvedValue({
      id: "new-invite",
    });
    directories.updateInvitation.mockReset();
    DirectoriesClient.mockReset().mockImplementation(() => {
      return directories;
    });

    organisations.addOrganisationToInvitation.mockReset();
    organisations.addOrganisationToUser.mockReset();
    OrganisationsClient.mockReset().mockImplementation(() => {
      return organisations;
    });

    jobs.queueNotifyRelyingParty.mockReset();
    JobsClient.mockReset().mockImplementation(() => {
      return jobs;
    });

    handler = getHandler(config, logger);
  });

  it("and a user already exists, then it should add org to user if org specified", async () => {
    getUserRaw.mockResolvedValue(existingUser);
    await handler.processor(data);

    expect(organisations.addOrganisationToUser).toHaveBeenCalledTimes(1);
    expect(organisations.addOrganisationToUser).toHaveBeenCalledWith(
      existingUser.sub,
      data.organisation,
      0,
    );
  });

  it("and a user already exists, then it should not attempt to add org to user if org not specified", async () => {
    getUserRaw.mockResolvedValue(existingUser);
    data.organisation = undefined;

    await handler.processor(data);

    expect(organisations.addOrganisationToUser).toHaveBeenCalledTimes(0);
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

    expect(getInvitation).toHaveBeenCalledTimes(0);
    expect(directories.updateInvitation).toHaveBeenCalledTimes(0);
    expect(createInvitation).toHaveBeenCalledTimes(0);
  });

  it("and an invitation already exists, then it should update invitation to include callback", async () => {
    getInvitation.mockReturnValue(existingInvitation);

    await handler.processor(data);

    expect(directories.updateInvitation).toHaveBeenCalledTimes(1);
    expect(directories.updateInvitation.mock.calls[0][0]).toMatchObject({
      id: "invite1",
      callbacks: [
        { sourceId: "test1", callback: "http://source2/users/" },
        { sourceId: data.sourceId, callback: data.callback },
      ],
    });
  });

  it("and an invitation already exists, then it should add org to invitation if org specified", async () => {
    getInvitation.mockReturnValue(existingInvitation);

    await handler.processor(data);

    expect(organisations.addOrganisationToInvitation).toHaveBeenCalledTimes(1);
    expect(organisations.addOrganisationToInvitation).toHaveBeenCalledWith(
      existingInvitation.id,
      data.organisation,
      0,
    );
  });

  it("and an invitation already exists, then it should not attempt to add invitation to user if org not specified", async () => {
    getInvitation.mockReturnValue(existingInvitation);
    data.organisation = undefined;

    await handler.processor(data);

    expect(organisations.addOrganisationToInvitation).toHaveBeenCalledTimes(0);
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

    expect(organisations.addOrganisationToInvitation).toHaveBeenCalledTimes(1);
    expect(organisations.addOrganisationToInvitation).toHaveBeenCalledWith(
      "new-invite",
      data.organisation,
      0,
    );
  });

  it("and the user is new to the system, then it should not attempt to add organisations to invitation if organisation not present", async () => {
    data.organisation = undefined;

    await handler.processor(data);

    expect(organisations.addOrganisationToInvitation).toHaveBeenCalledTimes(0);
  });
});
