jest.mock("login.dfe.api-client/services", () => ({
  getPaginatedServicesRaw: jest.fn(),
}));

const { getPaginatedServicesRaw } = require("login.dfe.api-client/services");
const {
  getAllApplicationRequiringNotification,
} = require("../../../../src/handlers/serviceNotifications/utils");

const config = {
  serviceNotifications: {
    applications: {
      type: "test",
    },
  },
};
const condition = () => true;
const correlationId = "correlation-id";

describe("when getting applications requiring notification", () => {
  beforeEach(() => {
    getPaginatedServicesRaw.mockReturnValue({
      services: [],
      numberOfPages: 1,
    });
  });

  it("then it should read all pages of applications", async () => {
    getPaginatedServicesRaw.mockReturnValue({
      services: [],
      numberOfPages: 2,
    });

    await getAllApplicationRequiringNotification(
      config,
      condition,
      correlationId,
    );

    expect(getPaginatedServicesRaw).toHaveBeenCalledTimes(2);
    expect(getPaginatedServicesRaw).toHaveBeenCalledWith({
      pageNumber: 1,
      pageSize: 100,
    });
    expect(getPaginatedServicesRaw).toHaveBeenCalledWith({
      pageNumber: 2,
      pageSize: 100,
    });
  });

  it("then it should return only applications meeting condition", async () => {
    const service1 = {
      id: "service-1",
      parentId: undefined,
      params: {
        receiveTestUpdates: true,
      },
    };
    const service2 = {
      id: "service-2",
      parentId: undefined,
      params: {
        receiveTestUpdates: false,
      },
    };
    getPaginatedServicesRaw.mockReturnValue({
      services: [service1, service2],
      numberOfPages: 1,
    });
    const testCondition = jest.fn().mockImplementation((service) => {
      return service.params && service.params.receiveTestUpdates;
    });

    const actual = await getAllApplicationRequiringNotification(
      config,
      testCondition,
      correlationId,
    );

    expect(actual).toHaveLength(1);
    expect(actual[0]).toBe(service1);
    expect(testCondition).toHaveBeenCalledTimes(2);
    expect(testCondition).toHaveBeenCalledWith(service1);
    expect(testCondition).toHaveBeenCalledWith(service2);
  });

  it("then it should return applications meeting condition with children associated when moveChildrenToParent is true", async () => {
    const service1 = {
      id: "service-1",
      parentId: undefined,
      params: {
        receiveTestUpdates: true,
      },
    };
    const service2 = {
      id: "service-2",
      parentId: undefined,
      params: {
        receiveTestUpdates: false,
      },
    };
    const service3 = {
      id: "service-3",
      parentId: "service-1",
      params: {
        receiveTestUpdates: false,
      },
    };
    getPaginatedServicesRaw.mockReturnValue({
      services: [service1, service2, service3],
      numberOfPages: 1,
    });
    const testCondition = jest.fn().mockImplementation((service) => {
      return service.params && service.params.receiveTestUpdates;
    });

    const actual = await getAllApplicationRequiringNotification(
      config,
      testCondition,
      correlationId,
      true,
    );

    expect(actual).toHaveLength(1);
    expect(actual[0]).toBe(service1);
    expect(actual[0].children).toHaveLength(1);
    expect(actual[0].children[0]).toBe(service3);
  });

  it("then it should return applications meeting condition without children associated when moveChildrenToParent is false", async () => {
    const service1 = {
      id: "service-1",
      parentId: undefined,
      params: {
        receiveTestUpdates: true,
      },
    };
    const service2 = {
      id: "service-2",
      parentId: undefined,
      params: {
        receiveTestUpdates: false,
      },
    };
    const service3 = {
      id: "service-3",
      parentId: "service-1",
      params: {
        receiveTestUpdates: false,
      },
    };
    getPaginatedServicesRaw.mockReturnValue({
      services: [service1, service2, service3],
      numberOfPages: 1,
    });
    const testCondition = jest.fn().mockImplementation((service) => {
      return service.params && service.params.receiveTestUpdates;
    });

    const actual = await getAllApplicationRequiringNotification(
      config,
      testCondition,
      correlationId,
    );

    expect(actual).toHaveLength(1);
    expect(actual[0]).toBe(service1);
    expect(actual[0].children).not.toBeDefined();
  });
});
