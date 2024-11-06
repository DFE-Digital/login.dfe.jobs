const SoapMessage = require('./SoapMessage');

class ProvisionGroupS2SFormatter {
  getProvisionGroupSoapMessage(targetNamespace, action, id, code, name, status, parentId, parentCode) {
    const message = new SoapMessage(targetNamespace)
      .setBody({
        ProvisionCollectionGroup: {
          pcg: {
            CollectionGroupParentId: parentId || 0,
            action,
            collectionGroupCode: code,
            collectionGroupDescription: '',
            collectionGroupId: id,
            collectionGroupName: name,
            wsCollectionGroupStatusCode: status,
          },
        },
      });
    message.contentType = 'text/xml; charset=utf-8';
    return message;
  }
}
module.exports = ProvisionGroupS2SFormatter;