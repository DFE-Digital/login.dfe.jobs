jest.mock("../../../../src/infrastructure/access");
jest.mock("../../../../src/infrastructure/organisations");
jest.mock("../../../../src/handlers/serviceNotifications/utils");

const {
  getAllApplicationRequiringNotification,
} = require("../../../../src/handlers/serviceNotifications/utils");
const { getDefaultConfig, getLoggerMock } = require("../testUtils");
const {
  getHandler,
} = require("../../../../src/handlers/serviceNotifications/roles/roleUpdatedHandlerV1");

jest.mock("../../../../src/infrastructure/config/index", () => ({}));
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

const config = getDefaultConfig();
const logger = getLoggerMock();
const data = {
  id: "role-1",
  name: "role one",
};
const jobId = 1;

describe("when handling roleupdated_v1 job", () => {
  beforeEach(() => {
    getAllApplicationRequiringNotification.mockReset().mockReturnValue([]);
  });

  it("then it should return handler with correct type", () => {
    const handler = getHandler(config, logger);

    expect(handler.type).toBe("roleupdated_v1");
  });

  it("then it should create queue with correct connectionString", async () => {
    getAllApplicationRequiringNotification.mockReset().mockReturnValue([
      {
        id: "service1",
        relyingParty: {
          params: {
            wsWsdlUrl: "https://service.one/wsdl",
          },
        },
      },
    ]);

    const handler = getHandler(config, logger);
    await handler.processor(data, jobId);

    expect(Queue).toHaveBeenCalledTimes(1);
    expect(Queue).toHaveBeenCalledWith("sendwsroleupdated_v1_service1", {
      connection: { url: "redis://127.0.0.1:6379" },
    });
  });

  it("then it should get applications that require role updates", async () => {
    const handler = getHandler(config, logger);
    await handler.processor(data, jobId);

    expect(getAllApplicationRequiringNotification).toHaveBeenCalledTimes(1);
    expect(getAllApplicationRequiringNotification.mock.calls[0][0]).toBe(
      config,
    );
    expect(getAllApplicationRequiringNotification.mock.calls[0][2]).toBe(
      "roleupdated-1",
    );
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
        relyingParty: { params: { receiveRoleUpdates: "false" } },
      }),
    ).toBe(false);
    expect(
      getAllApplicationRequiringNotification.mock.calls[0][1]({
        relyingParty: { params: { receiveRoleUpdates: "true" } },
      }),
    ).toBe(true);
  });

  it("then it should queue a sendwsroleupdated_v1 job for each application", async () => {
    getAllApplicationRequiringNotification.mockReset().mockReturnValue([
      {
        id: "service1",
        relyingParty: {
          params: {
            wsWsdlUrl: "https://service.one/wsdl",
          },
        },
      },
      {
        id: "service2",
        relyingParty: {
          params: {
            wsWsdlUrl: "https://service.two/wsdl",
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
      "sendwsroleupdated_v1_service1",
      {
        applicationId: "service1",
        role: data,
      },
      bullQueueTtl,
    );
    expect(mockAdd).toHaveBeenCalledWith(
      "sendwsroleupdated_v1_service2",
      {
        applicationId: "service2",
        role: data,
      },
      bullQueueTtl,
    );
  });
});
