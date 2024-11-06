const SoapMessage = require('./SoapMessage');

class ProvisionOrganisationS2SFormatter {
  getProvisionOrganisationSoapMessage(targetNamespace, action, establishmentDfeNumber, establishmentUrn, establishmentNumber, groupUid, localAuthorityCode, localAuthorityName, orgEdubaseTypeCode, organisationId, organisationName, organisationTypeCode, wsOrganisationStatusCode, regionCode, telephoneNumber) {
    const message = new SoapMessage(targetNamespace)
      .setBody({
        ProvisionOrganisation: {
          por: {
            action,
            establishmentNumber: establishmentNumber || "",
            localAuthorityCode: localAuthorityCode || "",
            localAuthorityName: localAuthorityName || "",
            organisationId: organisationId || " ",
            organisationName: organisationName || "",
            organisationTypeCode: organisationTypeCode || "",
            regionCode: regionCode || "E",
            telephoneNumber: telephoneNumber || "" ,
            typeOfEstablishmentCode: orgEdubaseTypeCode || "",
            wsOrganisationStatusCode: wsOrganisationStatusCode == 3 ? 1 : wsOrganisationStatusCode,
          },
        },
      });
    message.contentType = 'text/xml; charset=utf-8';
    return message;
  }
}
module.exports = ProvisionOrganisationS2SFormatter;
