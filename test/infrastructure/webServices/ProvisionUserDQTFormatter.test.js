const provisionUserDQTFormatter = require("../../../src/infrastructure/webServices/ProvisionUserDQTFormatter");

describe("provisionUserDQTFormatter", () => {
  it("creates an xml message when getProvisionUserSoapMessage is called", async () => {
    const test = new provisionUserDQTFormatter();
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
        request: {
          "data:action": "action",
          "data:emailAddress": "emailAddress",
          "data:firstName": "firstName",
          "data:lastName": "lastName",
          "data:organisationId": "organisationId",
          "data:userId": "saUserId",
          "data:userName": "saUsername",
          "data:wsAccountStatusCode": "wsAccountStatusCode",
        },
      },
    });

    expect(actual.toXmlString()).toBe(
      '<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:ws="targetNamespace"' +
        ' xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:data="http://capgemini.com/services/dfe/sa/evolvesync/data">' +
        "<soapenv:Body><ws:ProvisionUser><ws:request><data:userId>saUserId</data:userId><data:userName>saUsername</data:userName>" +
        "<data:wsAccountStatusCode>wsAccountStatusCode</data:wsAccountStatusCode><data:firstName>firstName</data:firstName>" +
        "<data:lastName>lastName</data:lastName><data:emailAddress>emailAddress</data:emailAddress>" +
        "<data:organisationId>organisationId</data:organisationId><data:action>action</data:action>" +
        "</ws:request></ws:ProvisionUser></soapenv:Body></soapenv:Envelope>",
    );
  });
});
