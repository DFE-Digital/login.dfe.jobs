const SecureAccessWebServiceClient = require("../../../src/infrastructure/webServices/SecureAccessWebServiceClient");

const getResponse = (status, contentType, body) => ({
  status,
  headers: {
    get: jest.fn().mockReturnValue(contentType),
  },
  text: jest.fn().mockResolvedValue(body),
});

const wsdlBody = `<?xml version="1.0" encoding="utf-8"?>
<definitions targetNamespace="urn:test" xmlns="http://schemas.xmlsoap.org/wsdl/" xmlns:wsaw="http://www.w3.org/2006/05/addressing/wsdl">
  <portType>
    <operation name="ProvisionUser">
      <input wsaw:Action="urn:test:ProvisionUser" />
    </operation>
    <operation name="ProvisionGroup">
      <input wsaw:Action="urn:test:ProvisionGroup" />
    </operation>
    <operation name="ProvisionOrganisation">
      <input wsaw:Action="urn:test:ProvisionOrganisation" />
    </operation>
  </portType>
  <service>
    <port>
      <address location="https://legacy.test/ws" />
    </port>
  </service>
</definitions>`;

describe("SecureAccessWebServiceClient", () => {
  beforeEach(() => {
    global.fetch = jest.fn();
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it("throws when SOAP response body includes a SOAP 1.1 fault", async () => {
    const faultBody = `<?xml version="1.0"?>
<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
  <soap:Body>
    <soap:Fault>
      <faultcode>Client</faultcode>
      <faultstring>Payload rejected</faultstring>
    </soap:Fault>
  </soap:Body>
</soap:Envelope>`;

    global.fetch
      .mockResolvedValueOnce(getResponse(200, "text/xml", wsdlBody))
      .mockResolvedValueOnce(getResponse(200, "text/xml", faultBody));

    const client = await SecureAccessWebServiceClient.create(
      "https://legacy.test/wsdl",
      "username",
      "password",
      false,
      "corr-id",
    );

    await expect(
      client.provisionUser(
        "UPDATE",
        "12345",
        "legacy.user",
        "First",
        "Last",
        "user@example.test",
        123,
        1,
        "10001",
        "999",
        [],
      ),
    ).rejects.toThrow("Client: Payload rejected");
  });

  it("throws when SOAP body is empty even if transport checks pass", async () => {
    global.fetch
      .mockResolvedValueOnce(getResponse(200, "text/xml", wsdlBody))
      .mockResolvedValueOnce(getResponse(200, "text/xml", ""));

    const client = await SecureAccessWebServiceClient.create(
      "https://legacy.test/wsdl",
      "username",
      "password",
      false,
      "corr-id",
    );

    await expect(
      client.provisionUser(
        "UPDATE",
        "12345",
        "legacy.user",
        "First",
        "Last",
        "user@example.test",
        123,
        1,
        "10001",
        "999",
        [],
      ),
    ).rejects.toThrow("SOAP endpoint returned an empty response body");
  });

  it("allows SOAP responses without a fault", async () => {
    const successBody = `<?xml version="1.0"?>
<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
  <soap:Body>
    <ProvisionUserResponse xmlns="urn:test">
      <ProvisionUserResult>Success</ProvisionUserResult>
    </ProvisionUserResponse>
  </soap:Body>
</soap:Envelope>`;

    global.fetch
      .mockResolvedValueOnce(getResponse(200, "text/xml", wsdlBody))
      .mockResolvedValueOnce(getResponse(200, "text/xml", successBody));

    const client = await SecureAccessWebServiceClient.create(
      "https://legacy.test/wsdl",
      "username",
      "password",
      false,
      "corr-id",
    );

    await expect(
      client.provisionUser(
        "UPDATE",
        "12345",
        "legacy.user",
        "First",
        "Last",
        "user@example.test",
        123,
        1,
        "10001",
        "999",
        [],
      ),
    ).resolves.toBeUndefined();
  });
});
