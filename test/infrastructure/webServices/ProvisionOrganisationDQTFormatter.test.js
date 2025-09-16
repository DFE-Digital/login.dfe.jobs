const provisionOrganisationDQTFormatter = require("../../../src/infrastructure/webServices/ProvisionOrganisationDQTFormatter");

describe("provisionOrganisationDQTFormatter", () => {
  it("creates an xml message when getProvisionOrganisationSoapMessage is called", async () => {
    const test = new provisionOrganisationDQTFormatter();
    const actual = test.getProvisionOrganisationSoapMessage(
      "targetNamespace",
      "action",
      "establishmentDfeNumber",
      "establishmentUrn",
      "establishmentNumber",
      "groupUid",
      "localAuthorityCode",
      "localAuthorityName",
      "orgEdubaseTypeCode",
      "organisationId",
      "organisationName",
      "organisationTypeCode",
      "wsOrganisationStatusCode",
    );

    expect(actual._body).toStrictEqual({
      ProvisionOrganisation: {
        request: {
          "data:action": "action",
          "data:establishmentDfeNumber": "establishmentDfeNumber",
          "data:establishmentUrn": "establishmentUrn",
          "data:localAuthorityCode": "localAuthorityCode",
          "data:orgEdubaseTypeCode": "orgEdubaseTypeCode",
          "data:organisationId": "organisationId",
          "data:organisationName": "organisationName",
          "data:organisationTypeCode": "organisationTypeCode",
          "data:wsOrganisationStatusCode": "wsOrganisationStatusCode",
        },
      },
    });

    expect(actual.toXmlString()).toBe(
      '<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:ws="targetNamespace"' +
        ' xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:data="http://capgemini.com/services/dfe/sa/evolvesync/data">' +
        "<soapenv:Body><ws:ProvisionOrganisation><ws:request><data:organisationId>organisationId</data:organisationId>" +
        "<data:organisationName>organisationName</data:organisationName>" +
        "<data:organisationTypeCode>organisationTypeCode</data:organisationTypeCode>" +
        "<data:wsOrganisationStatusCode>wsOrganisationStatusCode</data:wsOrganisationStatusCode>" +
        "<data:establishmentDfeNumber>establishmentDfeNumber</data:establishmentDfeNumber>" +
        "<data:establishmentUrn>establishmentUrn</data:establishmentUrn>" +
        "<data:localAuthorityCode>localAuthorityCode</data:localAuthorityCode>" +
        "<data:action>action</data:action><data:orgEdubaseTypeCode>orgEdubaseTypeCode</data:orgEdubaseTypeCode>" +
        "</ws:request></ws:ProvisionOrganisation></soapenv:Body></soapenv:Envelope>",
    );
  });
});
