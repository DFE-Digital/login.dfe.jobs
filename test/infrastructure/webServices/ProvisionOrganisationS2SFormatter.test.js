const provisionOrganisationS2SFormatter = require("../../../src/infrastructure/webServices/ProvisionOrganisationS2SFormatter");

describe("provisionOrganisationS2SFormatter", () => {
  it("creates an xml message when getProvisionOrganisationSoapMessage is called", async () => {
    const test = new provisionOrganisationS2SFormatter();
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
      "regionCode",
      "telephoneNumber",
    );

    expect(actual._body).toStrictEqual({
      ProvisionOrganisation: {
        por: {
          action: "action",
          establishmentNumber: "establishmentNumber",
          localAuthorityCode: "localAuthorityCode",
          localAuthorityName: "localAuthorityName",
          organisationId: "organisationId",
          organisationName: "organisationName",
          organisationTypeCode: "organisationTypeCode",
          regionCode: "regionCode",
          telephoneNumber: "telephoneNumber",
          typeOfEstablishmentCode: "orgEdubaseTypeCode",
          wsOrganisationStatusCode: "wsOrganisationStatusCode",
        },
      },
    });

    expect(actual.toXmlString()).toBe(
      '<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:ws="targetNamespace"' +
        ' xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"><soapenv:Body><ws:ProvisionOrganisation><ws:por>' +
        "<ws:action>action</ws:action><ws:establishmentNumber>establishmentNumber</ws:establishmentNumber>" +
        "<ws:localAuthorityCode>localAuthorityCode</ws:localAuthorityCode>" +
        "<ws:localAuthorityName>localAuthorityName</ws:localAuthorityName>" +
        "<ws:organisationId>organisationId</ws:organisationId>" +
        "<ws:organisationName>organisationName</ws:organisationName>" +
        "<ws:organisationTypeCode>organisationTypeCode</ws:organisationTypeCode><ws:regionCode>regionCode</ws:regionCode>" +
        "<ws:telephoneNumber>telephoneNumber</ws:telephoneNumber>" +
        "<ws:typeOfEstablishmentCode>orgEdubaseTypeCode</ws:typeOfEstablishmentCode>" +
        "<ws:wsOrganisationStatusCode>wsOrganisationStatusCode</ws:wsOrganisationStatusCode>" +
        "</ws:por></ws:ProvisionOrganisation></soapenv:Body></soapenv:Envelope>",
    );
  });
});
