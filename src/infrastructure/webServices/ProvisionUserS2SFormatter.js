const SoapMessage = require("./SoapMessage");

// S2S rejects the DSI status 0 that marks a deactivation with a 500. 2
// (disabled) is the value COLLECT accepts for this provisioning code (NSA-9989).
const DISABLED_ACCOUNT_STATUS = 2;

class ProvisionUserS2SFormatter {
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
  ) {
    const message = new SoapMessage(targetNamespace).setBody({
      ProvisionUser: {
        pur: {
          action,
          emailAddress,
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
    message.contentType = "text/xml; charset=utf-8";
    return message;
  }
}

module.exports = ProvisionUserS2SFormatter;
