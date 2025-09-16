jest.mock("login.dfe.async-retry");
jest.mock("jsonwebtoken");

jest.mock("login.dfe.api-client/services", () => ({
  getServiceRaw: jest.fn(),
}));

const { fetchApi } = require("login.dfe.async-retry");
const jwt = require("jsonwebtoken");
const {
  getHandler,
} = require("../../../../src/handlers/publicApi/invite/publicInvitationNotifyRelyingPartyV1");
const { getServiceRaw } = require("login.dfe.api-client/services");

const config = {
  queueStorage: {
    connectionString: "",
  },
  publicApi: {
    directories: {},
    organisations: {},
    applications: {},
    auth: {
      jwtSecret: "some-super-secure-secret",
    },
  },
};
const logger = {
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};

describe("when handling a notify relying party (v1)", () => {
  let handler;
  let data;

  beforeEach(() => {
    data = {
      userId: "user-1",
      sourceId: "firstuser",
      callback: "http://source/callback",
    };

    jwt.sign.mockReturnValue("json-web-token");
    handler = getHandler(config, logger);
  });

  it("then it should not attempt to send a callback if its not present in the payload", async () => {
    data.callback = undefined;
    await handler.processor(data);

    expect(fetchApi).toHaveBeenCalledTimes(0);
  });

  it("then it should post a request to the callback", async () => {
    await handler.processor(data);

    expect(fetchApi).toHaveBeenCalledTimes(1);
    expect(fetchApi.mock.calls[0][0]).toBe(data.callback);
    expect(fetchApi.mock.calls[0][1].method).toBe("POST");
  });

  it("then it should authorize the call to the callback with a jwt signed using general secret if callback does not have clientid", async () => {
    await handler.processor(data);

    expect(jwt.sign).toHaveBeenCalledTimes(1);
    expect(jwt.sign).toHaveBeenCalledWith({}, config.publicApi.auth.jwtSecret, {
      expiresIn: "10m",
      issuer: "signin.education.gov.uk",
    });
    expect(fetchApi.mock.calls[0][1]).toMatchObject({
      headers: {
        authorization: "bearer json-web-token",
      },
    });
  });

  it("then it should authorize the call to the callback with a jwt signed using client api secret if callback has clientid", async () => {
    const apiSecret = "client_api_secret";
    getServiceRaw.mockResolvedValue({
      relyingParty: {
        api_secret: apiSecret,
      },
    });
    data.clientId = "clientone";

    await handler.processor(data);

    expect(getServiceRaw).toHaveBeenCalledTimes(1);
    expect(getServiceRaw).toHaveBeenCalledWith({
      by: { clientId: "clientone" },
    });
    expect(jwt.sign).toHaveBeenCalledTimes(1);
    expect(jwt.sign).toHaveBeenCalledWith({}, apiSecret, {
      expiresIn: "10m",
      issuer: "signin.education.gov.uk",
    });
    expect(fetchApi.mock.calls[0][1]).toMatchObject({
      headers: {
        authorization: "bearer json-web-token",
      },
    });
  });

  it("then it should send the users id and source id in body", async () => {
    await handler.processor(data);

    expect(fetchApi.mock.calls[0][1]).toMatchObject({
      body: {
        sub: data.userId,
        sourceId: data.sourceId,
      },
    });
  });

  it("should log an error when an exception happens", async () => {
    fetchApi.mockImplementation(() => {
      const error = new Error("Server Error");
      error.statusCode = 500;
      throw error;
    });

    await expect(handler.processor(data)).rejects.toThrow("Server Error");

    expect(logger.error).toHaveBeenCalledTimes(1);
    expect(logger.error.mock.calls[0][0]).toBe(
      "Error notifying rp - Server Error. (userId: user-1, sourceId: firstuser, callback: http://source/callback)",
    );
  });
});
