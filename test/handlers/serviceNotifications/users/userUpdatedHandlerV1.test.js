jest.mock("../../../../src/handlers/serviceNotifications/utils");

jest.mock("login.dfe.api-client/users", () => ({
  getUserRaw: jest.fn(),
  getUserServicesRaw: jest.fn(),
  getUserOrganisationsRaw: jest.fn(),
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
const {
  getUserRaw,
  getUserServicesRaw,
  getUserOrganisationsRaw,
} = require("login.dfe.api-client/users");
const {
  getAllApplicationRequiringNotification,
} = require("../../../../src/handlers/serviceNotifications/utils");
const { getDefaultConfig, getLoggerMock } = require("../testUtils");
const {
  getHandler,
} = require("../../../../src/handlers/serviceNotifications/users/userUpdatedHandlerV1");

const config = getDefaultConfig();
const logger = getLoggerMock();
const data = {
  sub: "user1",
  email: "user.one@unit.tests",
  status: 1,
};
const jobId = 1;

describe("when handling userupdated_v1 job", () => {
  beforeEach(() => {
    getUserServicesRaw.mockReturnValue([
      {
        serviceId: "service1",
        organisationId: "organisation1",
        roles: [{ id: "role1", code: "ROLE-ONE", numericId: 1 }],
      },
      {
        serviceId: "service2",
        organisationId: "organisation1",
        roles: [{ id: "role2", code: "ROLE-TWO", numericId: 2 }],
      },
    ]);

    getUserOrganisationsRaw.mockReturnValue([
      {
        organisation: {
          id: "organisation1",
          legacyId: 123,
          urn: "985632",
          localAuthority: {
            code: "999",
          },
        },
        numericIdentifier: "sauser1",
      },
    ]);

    getUserRaw.mockResolvedValue({
      sub: "user1",
      email: "user.one-fromdir@unit.tests",
      status: 2,
    });
    getAllApplicationRequiringNotification.mockReset().mockReturnValue([]);
  });

  it("then it should return handler with correct type", () => {
    const handler = getHandler(config, logger);

    expect(handler.type).toBe("userupdated_v1");
  });

  it("then it should create queue with correct connectionString", async () => {
    getAllApplicationRequiringNotification.mockReset().mockReturnValue([
      {
        id: "service1",
        relyingParty: {
          params: {
            wsWsdlUrl: "https://service.one/wsdl",
            wsProvisionUserAction: "pu-action",
          },
        },
      },
    ]);

    const handler = getHandler(config, logger);
    await handler.processor(data, jobId);

    expect(Queue).toHaveBeenCalledTimes(1);
    expect(Queue).toHaveBeenCalledWith("sendwsuserupdated_v1_service1", {
      connection: { url: "redis://127.0.0.1:6379" },
    });
  });

  it("then it should get applications that require user updates", async () => {
    const handler = getHandler(config, logger);
    await handler.processor(data, jobId);

    expect(getAllApplicationRequiringNotification).toHaveBeenCalledTimes(1);
    expect(getAllApplicationRequiringNotification.mock.calls[0][0]).toBe(
      config,
    );
    expect(getAllApplicationRequiringNotification.mock.calls[0][2]).toBe(
      "userupdated-1",
    );
    expect(getAllApplicationRequiringNotification.mock.calls[0][3]).toBe(true);
    expect(
      getAllApplicationRequiringNotification.mock.calls[0][1]({}),
    ).toBeUndefined();
    expect(
      getAllApplicationRequiringNotification.mock.calls[0][1]({
        relyingParty: {},
      }),
    ).toBeUndefined();
    expect(
      getAllApplicationRequiringNotification.mock.calls[0][1]({
        relyingParty: { params: {} },
      }),
    ).toBe(false);
    expect(
      getAllApplicationRequiringNotification.mock.calls[0][1]({
        relyingParty: { params: { receiveUserUpdates: "false" } },
      }),
    ).toBe(false);
    expect(
      getAllApplicationRequiringNotification.mock.calls[0][1]({
        relyingParty: { params: { receiveUserUpdates: "true" } },
      }),
    ).toBe(true);
  });

  it("then it should queue a senduserupdated_v1 job for each application", async () => {
    getAllApplicationRequiringNotification.mockReset().mockReturnValue([
      {
        id: "service1",
        relyingParty: {
          params: {
            wsWsdlUrl: "https://service.one/wsdl",
            wsProvisionUserAction: "pu-action",
          },
        },
      },
      {
        id: "service2",
        relyingParty: {
          params: {
            wsWsdlUrl: "https://service.two/wsdl",
            wsProvisionUserAction: "pu-action-1",
          },
        },
      },
    ]);

    const handler = getHandler(config, logger);
    await handler.processor(data, jobId);

    expect(Queue).toHaveBeenCalledTimes(2);
    expect(mockClose).toHaveBeenCalledTimes(2);
    expect(mockAdd).toHaveBeenCalledTimes(2);
    expect(mockAdd).toHaveBeenCalledWith(
      "sendwsuserupdated_v1_service1",
      {
        applicationId: "service1",
        user: {
          userId: "user1",
          legacyUserId: "sauser1",
          email: "user.one@unit.tests",
          status: 1,
          organisationId: 123,
          organisationUrn: "985632",
          organisationLACode: "999",
          roles: [
            {
              id: 1,
              code: "ROLE-ONE",
            },
          ],
        },
      },
      bullQueueTtl,
    );

    expect(mockAdd).toHaveBeenCalledWith(
      "sendwsuserupdated_v1_service2",
      {
        applicationId: "service2",
        user: {
          userId: "user1",
          legacyUserId: "sauser1",
          email: "user.one@unit.tests",
          status: 1,
          organisationId: 123,
          organisationUrn: "985632",
          organisationLACode: "999",
          roles: [
            {
              id: 2,
              code: "ROLE-TWO",
            },
          ],
        },
      },
      bullQueueTtl,
    );
  });

  it("then it should queue a senduserupdated_v1 job for each parent application if user has access to only child application", async () => {
    getAllApplicationRequiringNotification.mockReset().mockReturnValue([
      {
        id: "service1parent",
        relyingParty: {
          params: {
            wsWsdlUrl: "https://service.one/wsdl",
            wsProvisionUserAction: "pu-action",
          },
        },
        children: [{ id: "service1" }, { id: "service2" }],
      },
    ]);

    const handler = getHandler(config, logger);
    await handler.processor(data, jobId);

    expect(Queue).toHaveBeenCalledTimes(1);
    expect(mockClose).toHaveBeenCalledTimes(1);
    expect(mockAdd).toHaveBeenCalledTimes(1);
    expect(mockAdd).toHaveBeenCalledWith(
      "sendwsuserupdated_v1_service1parent",
      {
        applicationId: "service1parent",
        user: {
          userId: "user1",
          legacyUserId: "sauser1",
          email: "user.one@unit.tests",
          status: 1,
          organisationId: 123,
          organisationUrn: "985632",
          organisationLACode: "999",
          roles: [
            {
              id: 1,
              code: "ROLE-ONE",
            },
            {
              id: 2,
              code: "ROLE-TWO",
            },
          ],
        },
      },
      bullQueueTtl,
    );
  });

  it("then it should get user details from directories if data has no email", async () => {
    getAllApplicationRequiringNotification.mockReset().mockReturnValue([
      {
        id: "service1",
        relyingParty: {
          params: {
            wsWsdlUrl: "https://service.one/wsdl",
            wsProvisionUserAction: "pu-action",
          },
        },
      },
    ]);

    const handler = getHandler(config, logger);
    await handler.processor({ sub: data.sub, status: data.status }, jobId);

    expect(getUserRaw).toHaveBeenCalledTimes(1);
    expect(getUserRaw).toHaveBeenCalledWith({ by: { id: "user1" } });
    expect(mockClose).toHaveBeenCalledTimes(1);
    expect(mockAdd).toHaveBeenCalledTimes(1);
    expect(mockAdd).toHaveBeenCalledWith(
      "sendwsuserupdated_v1_service1",
      {
        applicationId: "service1",
        user: {
          userId: "user1",
          legacyUserId: "sauser1",
          email: "user.one-fromdir@unit.tests",
          status: 2,
          organisationId: 123,
          organisationUrn: "985632",
          organisationLACode: "999",
          roles: [
            {
              id: 1,
              code: "ROLE-ONE",
            },
          ],
        },
      },
      bullQueueTtl,
    );
  });

  it("then it should get user details from directories if data has no status", async () => {
    getAllApplicationRequiringNotification.mockReset().mockReturnValue([
      {
        id: "service1",
        relyingParty: {
          params: {
            wsWsdlUrl: "https://service.one/wsdl",
            wsProvisionUserAction: "pu-action",
          },
        },
      },
    ]);

    const handler = getHandler(config, logger);
    await handler.processor({ sub: data.sub, email: data.email }, jobId);

    expect(getUserRaw).toHaveBeenCalledTimes(1);
    expect(getUserRaw).toHaveBeenCalledWith({ by: { id: "user1" } });
    expect(mockClose).toHaveBeenCalledTimes(1);
    expect(mockAdd).toHaveBeenCalledTimes(1);
    expect(mockAdd).toHaveBeenCalledWith(
      "sendwsuserupdated_v1_service1",
      {
        applicationId: "service1",
        user: {
          userId: "user1",
          legacyUserId: "sauser1",
          email: "user.one-fromdir@unit.tests",
          status: 2,
          organisationId: 123,
          organisationUrn: "985632",
          organisationLACode: "999",
          roles: [
            {
              id: 1,
              code: "ROLE-ONE",
            },
          ],
        },
      },
      bullQueueTtl,
    );
  });

  it("then it should get establishment number as LA code if category is 002", async () => {
    getUserOrganisationsRaw.mockReturnValue([
      {
        organisation: {
          id: "organisation1",
          legacyId: 123,
          urn: "985632",
          category: {
            id: "002",
          },
          establishmentNumber: "898",
        },
        numericIdentifier: "sauser1",
      },
    ]);

    getAllApplicationRequiringNotification.mockReset().mockReturnValue([
      {
        id: "service1",
        relyingParty: {
          params: {
            wsWsdlUrl: "https://service.one/wsdl",
            wsProvisionUserAction: "pu-action",
          },
        },
      },
    ]);

    const handler = getHandler(config, logger);
    await handler.processor(data, jobId);

    expect(mockClose).toHaveBeenCalledTimes(1);
    expect(mockAdd).toHaveBeenCalledTimes(1);
    expect(mockAdd).toHaveBeenCalledWith(
      "sendwsuserupdated_v1_service1",
      {
        applicationId: "service1",
        user: {
          userId: "user1",
          legacyUserId: "sauser1",
          email: "user.one@unit.tests",
          status: 1,
          organisationId: 123,
          organisationUrn: "985632",
          organisationLACode: "898",
          roles: [
            {
              id: 1,
              code: "ROLE-ONE",
            },
          ],
        },
      },
      bullQueueTtl,
    );
  });
});
