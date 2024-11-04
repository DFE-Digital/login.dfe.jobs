const SoapMessage = require('./SoapMessage');

class ProvisionOrganisationDQTFormatter {
  getProvisionOrganisationSoapMessage(targetNamespace, action, establishmentDfeNumber, establishmentUrn, establishmentNumber, groupUid, localAuthorityCode, localAuthorityName, orgEdubaseTypeCode, organisationId, organisationName, organisationTypeCode, wsOrganisationStatusCode, regionCode, telephoneNumber) {
    const message = new SoapMessage(targetNamespace)
      .addNamespace('data', 'http://capgemini.com/services/dfe/sa/evolvesync/data')
      .setBody({
        ProvisionOrganisation: {
          request: {
            'data:organisationId': organisationId || '',
            'data:organisationName': organisationName || '',
            'data:organisationTypeCode': organisationTypeCode || '',
            'data:wsOrganisationStatusCode': wsOrganisationStatusCode || '',
            'data:establishmentDfeNumber': establishmentDfeNumber || '',
            'data:establishmentUrn': establishmentUrn || '',
            'data:localAuthorityCode': localAuthorityCode || '',
            'data:action': action,
            'data:orgEdubaseTypeCode': orgEdubaseTypeCode || '',
          },
        },
      });
    return message;
  }
}

module.exports = ProvisionOrganisationDQTFormatter;
