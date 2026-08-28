const provisionUserS2SFormatter = require("../../../src/infrastructure/webServices/ProvisionUserS2SFormatter");

describe("provisionUserS2SFormatter", () => {
  it("creates an xml message when getProvisionUserSoapMessage is called", async () => {
    const test = new provisionUserS2SFormatter();
    const actual = test.getProvisionUserSoapMessage(
      "targetNamespace",
      "action",
      "saUserId",
      "saUsername",
      "firstName",
      "lastName",
      "emailAddress",
      "organisationId",
      "wsAccountStatusCode",
    );

    expect(actual._body).toStrictEqual({
      ProvisionUser: {
        pur: {
          action: "action",
          emailAddress: "emailAddress",
          organisationId: "organisationId",
          userId: "saUserId",
          userName: "saUsername",
          wsAccountStatusCode: "wsAccountStatusCode",
        },
      },
    });

    expect(actual.toXmlString()).toBe(
      '<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:ws="targetNamespace" ' +
        'xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"><soapenv:Body><ws:ProvisionUser><ws:pur>' +
        "<ws:action>action</ws:action><ws:emailAddress>emailAddress</ws:emailAddress>" +
        "<ws:organisationId>organisationId</ws:organisationId><ws:userId>saUserId</ws:userId>" +
        "<ws:userName>saUsername</ws:userName><ws:wsAccountStatusCode>wsAccountStatusCode</ws:wsAccountStatusCode>" +
        "</ws:pur></ws:ProvisionUser></soapenv:Body></soapenv:Envelope>",
    );
  });

  it("passes wsAccountStatusCode through unchanged as a number", () => {
    const formatter = new provisionUserS2SFormatter();
    const message = formatter.getProvisionUserSoapMessage(
      "http://example.com/ns",
      "UPDATE",
      "uid1",
      "uname1",
      "Jane",
      "Doe",
      "jane@example.com",
      "org-1",
      1,
    );
    expect(message._body.ProvisionUser.pur.wsAccountStatusCode).toBe(1);
  });

  it("sends action DEACTIVATE with wsAccountStatusCode 0 for a deactivation", () => {
    const formatter = new provisionUserS2SFormatter();
    const message = formatter.getProvisionUserSoapMessage(
      "http://example.com/ns",
      "DEACTIVATE",
      "uid1",
      "uname1",
      "Jane",
      "Doe",
      "jane@example.com",
      "org-1",
      0,
    );
    expect(message._body.ProvisionUser.pur.action).toBe("DEACTIVATE");
    expect(message._body.ProvisionUser.pur.wsAccountStatusCode).toBe(0);
  });
});
