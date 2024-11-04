const SoapMessage = require('./SoapMessage');

class ProvisionUserDefaultFormatter {
  getProvisionUserSoapMessage(targetNamespace, action, saUserId, saUsername, firstName, lastName, emailAddress, organisationId, wsAccountStatusCode, establishmentUrn, localAuthorityCode, groupUpdates, organisationUid) {
    return new SoapMessage(targetNamespace).setBody({
      ProvisionUser: {
        pur: {
          saUserID: saUserId,
          emailAddress,
          organisationId,
          wsAccountStatusCode: wsAccountStatusCode === 1 ? 'Active' : 'Archived',
          establishmentUrn,
          groupUid: organisationUid,
          localAuthorityCode,
          groups: groupUpdates.map(gu => ({
            SaUserGroup: {
              id: gu.id,
              code: gu.code,
            },
          })),
          action,
        },
      },
    });
  }
}
module.exports = ProvisionUserDefaultFormatter;
