const SoapMessage = require('./SoapMessage');

class ProvisionOrganisationDefaultFormatter {
  getProvisionOrganisationSoapMessage(targetNamespace, action, establishmentDfeNumber, establishmentUrn, establishmentNumber, groupUid, localAuthorityCode, localAuthorityName, orgEdubaseTypeCode, organisationId, organisationName, organisationTypeCode, wsOrganisationStatusCode, regionCode, telephoneNumber) {
    let textWsOrganisationStatusCode = null;
    if (wsOrganisationStatusCode === 1) {
      textWsOrganisationStatusCode = 'OPEN';
    } else if (wsOrganisationStatusCode === 2) {
      textWsOrganisationStatusCode = 'CLOSED';
    } else if (wsOrganisationStatusCode === 3) {
      textWsOrganisationStatusCode = 'CLOSED_BUT_ACTIVE';
    } else if (wsOrganisationStatusCode === 4) {
      textWsOrganisationStatusCode = 'PROPOSED_TO_OPEN';
    }
    return new SoapMessage(targetNamespace).setBody({
      ProvisionOrganisation: {
        por: {
          action,
          establishmentUrn,
          groupUid,
          organisationId,
          organisationName,
          localAuthorityCode,
          wsOrganisationStatusCode: textWsOrganisationStatusCode,
          organisationTypeCode,
        },
      },
    });
  }
}
module.exports = ProvisionOrganisationDefaultFormatter;