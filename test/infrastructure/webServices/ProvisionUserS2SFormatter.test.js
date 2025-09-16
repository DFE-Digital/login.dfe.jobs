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
});
