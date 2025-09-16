const provisionUserDefaultFormatter = require("../../../src/infrastructure/webServices/ProvisionUserDefaultFormatter");

describe("provisionUserDefaultFormatter", () => {
  it("creates an xml message when getProvisionUserSoapMessage is called", async () => {
    const test = new provisionUserDefaultFormatter();
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
      "establishmentUrn",
      "localAuthorityCode",
      [
        { code: "code", id: "id" },
        { code: "code2", id: "id2" },
      ],
      "organisationUid",
    );

    expect(actual._body).toStrictEqual({
      ProvisionUser: {
        pur: {
          action: "action",
          emailAddress: "emailAddress",
          establishmentUrn: "establishmentUrn",
          groupUid: "organisationUid",
          groups: [
            {
              SaUserGroup: {
                code: "code",
                id: "id",
              },
            },
            {
              SaUserGroup: {
                code: "code2",
                id: "id2",
              },
            },
          ],
          localAuthorityCode: "localAuthorityCode",
          organisationId: "organisationId",
          saUserID: "saUserId",
          wsAccountStatusCode: "Archived",
        },
      },
    });

    expect(actual.toXmlString()).toBe(
      '<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:ws="targetNamespace"' +
        ' xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"><soapenv:Body><ws:ProvisionUser><ws:pur>' +
        "<ws:saUserID>saUserId</ws:saUserID><ws:emailAddress>emailAddress</ws:emailAddress>" +
        "<ws:organisationId>organisationId</ws:organisationId>" +
        "<ws:wsAccountStatusCode>Archived</ws:wsAccountStatusCode><ws:establishmentUrn>establishmentUrn</ws:establishmentUrn>" +
        "<ws:groupUid>organisationUid</ws:groupUid><ws:localAuthorityCode>localAuthorityCode</ws:localAuthorityCode>" +
        "<ws:groups><ws:SaUserGroup><ws:id>id</ws:id><ws:code>code</ws:code></ws:SaUserGroup>" +
        "<ws:SaUserGroup><ws:id>id2</ws:id><ws:code>code2</ws:code></ws:SaUserGroup>" +
        "</ws:groups><ws:action>action</ws:action></ws:pur></ws:ProvisionUser></soapenv:Body></soapenv:Envelope>",
    );
  });
});
