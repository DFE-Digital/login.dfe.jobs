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

  describe("when data contains removedServiceId (deactivation)", () => {
    beforeEach(() => {
      getUserRaw.mockResolvedValue({
        sub: "user1",
        email: "user.one-fromdir@unit.tests",
        given_name: "John",
        family_name: "Doe",
        status: 1,
      });
    });

    // Scenario 1 — Service removal triggers deactivation sync to COLLECT
    it("should enqueue SOAP deactivation job with status 0 for COLLECT when removedServiceId matches", async () => {
      const collectServiceId = "collect-service-id";
      getAllApplicationRequiringNotification.mockReturnValueOnce([
        {
          id: collectServiceId,
          relyingParty: { params: { receiveUserUpdates: "true" } },
        },
      ]);
      const payload = {
        sub: "user-123",
        removedServiceId: collectServiceId,
        removedOrgId: "org-456",
      };

      const handler = getHandler(config, logger);
      await handler.processor(payload, jobId);

      expect(mockAdd).toHaveBeenCalledTimes(1);
      expect(mockAdd).toHaveBeenCalledWith(
        `sendwsuserupdated_v1_${collectServiceId}`,
        {
          applicationId: collectServiceId,
          user: expect.objectContaining({
            userId: "user1",
            status: 0,
            organisationId: "org-456",
          }),
        },
        bullQueueTtl,
      );
      expect(getUserServicesRaw).not.toHaveBeenCalled();
    });

    // Scenario 2 — Service removal triggers deactivation sync to S2S
    it("should enqueue SOAP deactivation job with status 0 for S2S when removedServiceId matches", async () => {
      const s2sServiceId = "s2s-service-id";
      getAllApplicationRequiringNotification.mockReturnValueOnce([
        {
          id: s2sServiceId,
          relyingParty: { params: { receiveUserUpdates: "true" } },
        },
      ]);
      const payload = {
        sub: "user-123",
        removedServiceId: s2sServiceId,
        removedOrgId: "org-456",
      };

      const handler = getHandler(config, logger);
      await handler.processor(payload, jobId);

      expect(mockAdd).toHaveBeenCalledTimes(1);
      expect(mockAdd).toHaveBeenCalledWith(
        `sendwsuserupdated_v1_${s2sServiceId}`,
        {
          applicationId: s2sServiceId,
          user: expect.objectContaining({
            userId: "user1",
            status: 0,
            organisationId: "org-456",
          }),
        },
        bullQueueTtl,
      );
      expect(getUserServicesRaw).not.toHaveBeenCalled();
    });

    // Scenario 5 — Non-legacy service removal does not trigger SOAP sync
    it("should not enqueue any job and not call getUserServicesRaw when removedServiceId is non-legacy", async () => {
      getAllApplicationRequiringNotification.mockReturnValueOnce([
        {
          id: "some-other-legacy-service",
          relyingParty: { params: { receiveUserUpdates: "true" } },
        },
      ]);
      const payload = {
        sub: "user-123",
        removedServiceId: "non-legacy-service-id",
        removedOrgId: "org-456",
      };

      const handler = getHandler(config, logger);
      await handler.processor(payload, jobId);

      expect(mockAdd).not.toHaveBeenCalled();
      expect(getUserServicesRaw).not.toHaveBeenCalled();
    });

    // Scenario 4 — Unknown removedServiceId (app not found) does nothing and does not throw
    it("should not enqueue any job when removedServiceId does not match any known application", async () => {
      const payload = {
        sub: "user-123",
        removedServiceId: "unknown-service-id",
        removedOrgId: "org-456",
      };

      const handler = getHandler(config, logger);
      await expect(handler.processor(payload, jobId)).resolves.not.toThrow();

      expect(mockAdd).not.toHaveBeenCalled();
      expect(getUserServicesRaw).not.toHaveBeenCalled();
    });

    // Scenario 4/Backward compat — No removedServiceId falls through to existing getUserServicesRaw logic
    it("should call getUserServicesRaw and not trigger the deactivation branch when removedServiceId is absent", async () => {
      const normalPayload = {
        sub: "user1",
        email: "user.one@unit.tests",
        status: 1,
      };

      const handler = getHandler(config, logger);
      await handler.processor(normalPayload, jobId);

      expect(getUserServicesRaw).toHaveBeenCalledTimes(1);
      expect(getUserRaw).not.toHaveBeenCalled();
    });
  });
});
