const provisionUserCollectFormatter = require("../../../src/infrastructure/webServices/ProvisionUserCollectFormatter");

describe("provisionUserCollectFormatter", () => {
  it("creates an xml message when getProvisionUserSoapMessage is called", async () => {
    const test = new provisionUserCollectFormatter();
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
    );

    expect(actual._body).toStrictEqual({
      ProvisionUser: {
        pur: {
          Groups: {
            "cap:group": [
              {
                "cap:group": {
                  "cap:codeField": "code",
                  "cap:idField": "id",
                },
              },
              {
                "cap:group": {
                  "cap:codeField": "code2",
                  "cap:idField": "id2",
                },
              },
            ],
          },
          action: "action",
          emailAddress: "emailAddress",
          firstName: "firstName",
          lastName: "lastName",
          organisationId: "organisationId",
          userId: "saUserId",
          userName: "saUsername",
          wsAccountStatusCode: "wsAccountStatusCode",
        },
      },
    });

    expect(actual.toXmlString()).toBe(
      '<soapenv:Envelope xmlns:soapenv="http://www.w3.org/2003/05/soap-envelope" xmlns:ws="targetNamespace"' +
        ' xmlns:cap="http://schemas.datacontract.org/2004/07/Capgemini.DFE.ProvisioningSvcs.COLLECT.Common">' +
        "<soapenv:Body><ws:ProvisionUser><ws:pur><ws:Groups><cap:group><cap:group><cap:codeField>code</cap:codeField>" +
        "<cap:idField>id</cap:idField></cap:group><cap:group><cap:codeField>code2</cap:codeField><cap:idField>id2</cap:idField>" +
        "</cap:group></cap:group></ws:Groups><ws:action>action</ws:action><ws:emailAddress>emailAddress</ws:emailAddress>" +
        "<ws:firstName>firstName</ws:firstName><ws:lastName>lastName</ws:lastName>" +
        "<ws:organisationId>organisationId</ws:organisationId>" +
        "<ws:userId>saUserId</ws:userId><ws:userName>saUsername</ws:userName>" +
        "<ws:wsAccountStatusCode>wsAccountStatusCode</ws:wsAccountStatusCode>" +
        "</ws:pur></ws:ProvisionUser></soapenv:Body></soapenv:Envelope>",
    );
  });
});
