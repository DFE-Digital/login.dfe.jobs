const SoapMessage = require('./SoapMessage');

class ProvisionGroupCollectFormatter {
  getProvisionGroupSoapMessage(targetNamespace, action, id, code, name, status, parentId, parentCode) {
    const message = new SoapMessage(targetNamespace, 'http://www.w3.org/2003/05/soap-envelope', false)
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
    message.contentType = 'application/soap+xml; charset=utf-8';
    return message;
  }
}
module.exports = ProvisionGroupCollectFormatter;