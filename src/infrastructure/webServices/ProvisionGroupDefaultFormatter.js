const SoapMessage = require('./SoapMessage');

class ProvisionGroupDefaultFormatter {
  getProvisionGroupSoapMessage(targetNamespace, action, id, code, name, status, parentId, parentCode) {
    return new SoapMessage(targetNamespace).setBody({
      ProvisionGroup: {
        pgr: {
          id,
          code,
          name,
          status,
          parentId,
          parentCode,
          action,
        },
      },
    });
  }
}
module.exports = ProvisionGroupDefaultFormatter;