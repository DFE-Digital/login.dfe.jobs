const SoapMessage = require("./SoapMessage");

// COLLECT only accepts 1 (active) or 2 (disabled) for the account status, so the
// DSI status 0 that marks a deactivation is rejected with a 500 (NSA-9989).
const DISABLED_ACCOUNT_STATUS = 2;

class ProvisionUserCollectFormatter {
  getProvisionUserSoapMessage(
    targetNamespace,
    action,
    saUserId,
    saUsername,
    firstName,
    lastName,
    emailAddress,
    organisationId,
    wsAccountStatusCode,
    establishmentUrn,
    localAuthorityCode,
    groupUpdates,
  ) {
    const message = new SoapMessage(
      targetNamespace,
      "http://www.w3.org/2003/05/soap-envelope",
      false,
    )
      .addNamespace(
        "cap",
        "http://schemas.datacontract.org/2004/07/Capgemini.DFE.ProvisioningSvcs.COLLECT.Common",
      )
      .setBody({
        ProvisionUser: {
          pur: {
            Groups: {
              "cap:group": groupUpdates.map((gu) => ({
                "cap:group": {
                  "cap:codeField": gu.code,
                  "cap:idField": gu.id,
                },
              })),
            },
            action,
            emailAddress,
            firstName,
            lastName,
            organisationId,
            userId: saUserId,
            userName: saUsername,
            wsAccountStatusCode:
              action === "DEACTIVATE"
                ? DISABLED_ACCOUNT_STATUS
                : wsAccountStatusCode,
          },
        },
      });
    message.contentType = "application/soap+xml; charset=utf-8";
    return message;
  }
}

module.exports = ProvisionUserCollectFormatter;
