const SoapMessage = require('./SoapMessage');

class ProvisionUserDQTFormatter {
  getProvisionUserSoapMessage(targetNamespace, action, saUserId, saUsername, firstName, lastName, emailAddress, organisationId, wsAccountStatusCode, establishmentUrn, localAuthorityCode, groupUpdates) {
    const message = new SoapMessage(targetNamespace)
      .addNamespace('data', 'http://capgemini.com/services/dfe/sa/evolvesync/data')
      .setBody({
        ProvisionUser: {
          request: {
            'data:userId': saUserId,
            'data:userName': saUsername,
            'data:wsAccountStatusCode': wsAccountStatusCode,
            'data:firstName': firstName,
            'data:lastName': lastName,
            'data:emailAddress': emailAddress,
            'data:organisationId': organisationId,
            'data:action': action,
          },
        },
      });
    return message;
  }
}

module.exports = ProvisionUserDQTFormatter;