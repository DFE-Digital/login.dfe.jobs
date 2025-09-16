const provisionGroupDefaultFormatter = require("../../../src/infrastructure/webServices/ProvisionGroupDefaultFormatter");

describe("provisionGroupDefaultFormatter", () => {
  it("creates an xml message when getProvisionGroupSoapMessage is called", async () => {
    const test = new provisionGroupDefaultFormatter();
    const actual = test.getProvisionGroupSoapMessage(
      "targetNamespace",
      "action",
      "id",
      "code",
      "name",
      "status",
      "parentId",
      "parentCode",
    );

    expect(actual._body).toStrictEqual({
      ProvisionGroup: {
        pgr: {
          action: "action",
          code: "code",
          id: "id",
          name: "name",
          parentCode: "parentCode",
          parentId: "parentId",
          status: "status",
        },
      },
    });

    expect(actual.toXmlString()).toBe(
      '<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" ' +
        'xmlns:ws="targetNamespace" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">' +
        "<soapenv:Body><ws:ProvisionGroup><ws:pgr><ws:id>id</ws:id><ws:code>code</ws:code><ws:name>name</ws:name>" +
        "<ws:status>status</ws:status><ws:parentId>parentId</ws:parentId><ws:parentCode>parentCode</ws:parentCode>" +
        "<ws:action>action</ws:action></ws:pgr></ws:ProvisionGroup></soapenv:Body></soapenv:Envelope>",
    );
  });
});
