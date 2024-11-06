const SoapMessage = require('./SoapMessage');

class ProvisionUserCollectFormatter {
  getProvisionUserSoapMessage(targetNamespace, action, saUserId, saUsername, firstName, lastName, emailAddress, organisationId, wsAccountStatusCode, establishmentUrn, localAuthorityCode, groupUpdates) {
    const message = new SoapMessage(targetNamespace, 'http://www.w3.org/2003/05/soap-envelope', false)
      .addNamespace('cap', 'http://schemas.datacontract.org/2004/07/Capgemini.DFE.ProvisioningSvcs.COLLECT.Common')
      .setBody({
        ProvisionUser: {
          pur: {
            Groups: {
              'cap:group': groupUpdates.map(gu => ({
                'cap:group': {
                  'cap:codeField': gu.code,
                  'cap:idField': gu.id,
                },
              }))
            },
            action,
            emailAddress,
            firstName,
            lastName,
            organisationId,
            userId: saUserId,
            userName: saUsername,
            wsAccountStatusCode,
          },
        },
      });
    message.contentType = 'application/soap+xml; charset=utf-8';
    return message;
  }
}

module.exports = ProvisionUserCollectFormatter;