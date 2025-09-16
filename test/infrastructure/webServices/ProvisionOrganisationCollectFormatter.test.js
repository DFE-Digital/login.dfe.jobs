const provisionOrganisationCollectFormatter = require("../../../src/infrastructure/webServices/ProvisionOrganisationCollectFormatter");

describe("provisionOrganisationCollectFormatter", () => {
  it("creates an xml message when getProvisionOrganisationSoapMessage is called", async () => {
    const test = new provisionOrganisationCollectFormatter();
    const actual = test.getProvisionOrganisationSoapMessage(
      "namespace",
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
        por: {
          action: "action",
          establishmentDfeNumber: "establishmentDfeNumber",
          establishmentUrn: "establishmentUrn",
          localAuthorityCode: "localAuthorityCode",
          orgEdubaseTypeCode: "orgEdubaseTypeCode",
          organisationId: "organisationId",
          organisationName: "organisationName",
          organisationTypeCode: "organisationTypeCode",
          wsOrganisationStatusCode: "wsOrganisationStatusCode",
        },
      },
    });

    expect(actual.toXmlString()).toBe(
      '<soapenv:Envelope xmlns:soapenv="http://www.w3.org/2003/05/soap-envelope" xmlns:ws="namespace">' +
        "<soapenv:Body><ws:ProvisionOrganisation><ws:por><ws:action>action</ws:action>" +
        "<ws:establishmentDfeNumber>establishmentDfeNumber</ws:establishmentDfeNumber>" +
        "<ws:establishmentUrn>establishmentUrn</ws:establishmentUrn><ws:localAuthorityCode>localAuthorityCode</ws:localAuthorityCode>" +
        "<ws:orgEdubaseTypeCode>orgEdubaseTypeCode</ws:orgEdubaseTypeCode><ws:organisationId>organisationId</ws:organisationId>" +
        "<ws:organisationName>organisationName</ws:organisationName><ws:organisationTypeCode>organisationTypeCode</ws:organisationTypeCode>" +
        "<ws:wsOrganisationStatusCode>wsOrganisationStatusCode</ws:wsOrganisationStatusCode>" +
        "</ws:por></ws:ProvisionOrganisation></soapenv:Body></soapenv:Envelope>",
    );
  });
});
