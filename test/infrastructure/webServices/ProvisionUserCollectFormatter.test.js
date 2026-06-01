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
      1,
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
          wsAccountStatusCode: "Active",
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
        "<ws:wsAccountStatusCode>Active</ws:wsAccountStatusCode>" +
        "</ws:pur></ws:ProvisionUser></soapenv:Body></soapenv:Envelope>",
    );
  });

  it('sets wsAccountStatusCode to "Archived" when status is 0', () => {
    const test = new provisionUserCollectFormatter();
    const actual = test.getProvisionUserSoapMessage(
      "http://example.com/ns",
      "DEACTIVATE",
      "uid1",
      "uname1",
      "Jane",
      "Doe",
      "jane@example.com",
      "org-1",
      0,
      "URN123",
      "LA01",
      [],
    );
    expect(actual._body.ProvisionUser.pur.wsAccountStatusCode).toBe("Archived");
  });

  it('sets wsAccountStatusCode to "Active" when status is 1', () => {
    const test = new provisionUserCollectFormatter();
    const actual = test.getProvisionUserSoapMessage(
      "http://example.com/ns",
      "UPDATE",
      "uid1",
      "uname1",
      "Jane",
      "Doe",
      "jane@example.com",
      "org-1",
      1,
      "URN123",
      "LA01",
      [],
    );
    expect(actual._body.ProvisionUser.pur.wsAccountStatusCode).toBe("Active");
  });
});
