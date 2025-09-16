const provisionGroupS2SFormatter = require("../../../src/infrastructure/webServices/ProvisionGroupS2SFormatter");

describe("provisionGroupS2SFormatter", () => {
  it("creates an xml message when getProvisionGroupSoapMessage is called", async () => {
    const test = new provisionGroupS2SFormatter();
    const actual = test.getProvisionGroupSoapMessage(
      "namespace",
      "action",
      "id",
      "code",
      "name",
      "status",
      "parentId",
    );

    expect(actual._body).toStrictEqual({
      ProvisionCollectionGroup: {
        pcg: {
          CollectionGroupParentId: "parentId",
          action: "action",
          collectionGroupCode: "code",
          collectionGroupDescription: "",
          collectionGroupId: "id",
          collectionGroupName: "name",
          wsCollectionGroupStatusCode: "status",
        },
      },
    });

    expect(actual.toXmlString()).toBe(
      '<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:ws="namespace" ' +
        'xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"><soapenv:Body><ws:ProvisionCollectionGroup>' +
        "<ws:pcg><ws:CollectionGroupParentId>parentId</ws:CollectionGroupParentId><ws:action>action</ws:action>" +
        "<ws:collectionGroupCode>code</ws:collectionGroupCode><ws:collectionGroupDescription>" +
        "</ws:collectionGroupDescription><ws:collectionGroupId>id</ws:collectionGroupId>" +
        "<ws:collectionGroupName>name</ws:collectionGroupName>" +
        "<ws:wsCollectionGroupStatusCode>status</ws:wsCollectionGroupStatusCode>" +
        "</ws:pcg></ws:ProvisionCollectionGroup></soapenv:Body></soapenv:Envelope>",
    );
  });
});
