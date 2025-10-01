const provisionOrganisationDefaultFormatter = require("../../../src/infrastructure/webServices/ProvisionOrganisationDefaultFormatter");

describe("provisionOrganisationDefaultFormatter", () => {
  it("creates an xml message when getProvisionOrganisationSoapMessage is called", async () => {
    const test = new provisionOrganisationDefaultFormatter();
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
      1,
    );

    expect(actual._body).toStrictEqual({
      ProvisionOrganisation: {
        por: {
          action: "action",
          establishmentUrn: "establishmentUrn",
          groupUid: "groupUid",
          localAuthorityCode: "localAuthorityCode",
          organisationId: "organisationId",
          organisationName: "organisationName",
          organisationTypeCode: "organisationTypeCode",
          wsOrganisationStatusCode: "OPEN",
        },
      },
    });

    expect(actual.toXmlString()).toBe(
      '<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:ws="targetNamespace"' +
        ' xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"><soapenv:Body><ws:ProvisionOrganisation>' +
        "<ws:por><ws:action>action</ws:action><ws:establishmentUrn>establishmentUrn</ws:establishmentUrn>" +
        "<ws:groupUid>groupUid</ws:groupUid><ws:organisationId>organisationId</ws:organisationId>" +
        "<ws:organisationName>organisationName</ws:organisationName><ws:localAuthorityCode>localAuthorityCode</ws:localAuthorityCode>" +
        "<ws:wsOrganisationStatusCode>OPEN</ws:wsOrganisationStatusCode>" +
        "<ws:organisationTypeCode>organisationTypeCode</ws:organisationTypeCode>" +
        "</ws:por></ws:ProvisionOrganisation></soapenv:Body></soapenv:Envelope>",
    );
  });
});
