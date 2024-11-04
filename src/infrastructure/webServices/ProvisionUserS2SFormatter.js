const SoapMessage = require('./SoapMessage');

class ProvisionUserS2SFormatter {
  getProvisionUserSoapMessage(targetNamespace, action, saUserId, saUsername, firstName, lastName, emailAddress, organisationId, wsAccountStatusCode, establishmentUrn, localAuthorityCode, groupUpdates) {
    const message = new SoapMessage(targetNamespace)
      .setBody({
        ProvisionUser: {
          pur: {
            action,
            emailAddress,
            organisationId,
            userId: saUserId,
            userName: saUsername,
            wsAccountStatusCode,
          },
        },
      });
    message.contentType = 'text/xml; charset=utf-8';
    return message;
  }
}

module.exports = ProvisionUserS2SFormatter;
