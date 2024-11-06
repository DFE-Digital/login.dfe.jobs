const asyncRetry = require('login.dfe.async-retry');
const { parseString: parseXmlString } = require('xml2js');
const { stripPrefix } = require('xml2js/lib/processors');
const ProvisionUserDefaultFormatter = require('./ProvisionUserDefaultFormatter');
const ProvisionUserCollectFormatter = require('./ProvisionUserCollectFormatter');
const ProvisionUserS2SFormatter = require('./ProvisionUserS2SFormatter');
const ProvisionUserDQTFormatter = require('./ProvisionUserDQTFormatter');
const ProvisionOrganisationDefaultFormatter = require('./ProvisionOrganisationDefaultFormatter');
const ProvisionOrganisationCollectFormatter = require('./ProvisionOrganisationCollectFormatter');
const ProvisionOrganisationS2SFormatter = require('./ProvisionOrganisationS2SFormatter');
const ProvisionOrganisationDQTFormatter = require('./ProvisionOrganisationDQTFormatter');
const ProvisionGroupDefaultFormatter = require('./ProvisionGroupDefaultFormatter');
const ProvisionGroupCollectFormatter = require('./ProvisionGroupCollectFormatter');
const ProvisionGroupS2SFormatter = require('./ProvisionGroupS2SFormatter');

class SoapHttpClient {
  constructor(correlationId) {
    this.correlationId = correlationId;
  }

  request(rurl, data, callback, exheaders, exoptions) {
    let headers;
    
    if (exheaders) {
      headers = {};
      Object.keys(exheaders).forEach((name) => {
        let value = exheaders[name];
        headers[name] = value;
      });
    }

    asyncRetry(async () => {
      const method = data ? 'POST' : 'GET';

      if (method === 'POST' && !Object.keys(headers).find(h => h.toLowerCase() === 'content-type')) {
        headers['content-type'] = 'application/soap+xml; charset=utf-8';
      }

      const response = await fetch(rurl, {
        method,
        headers,
        body: data
      });

      if (response.status !== 200) {
        const responseBody = await response.text();

        throw new Error(`${rurl} returned status ${response.status} - ${responseBody}`);
      }

      const contentTypeHeader = response.headers.get('content-type') ?? '';

      if (!contentTypeHeader.startsWith('text/xml') && !contentTypeHeader.startsWith('application/soap+xml') && !contentTypeHeader.startsWith('Multipart/Related')) {
        throw new Error(`${rurl} returned content type ${contentTypeHeader} not text/xml`);
      }

      return response;

    }, asyncRetry.strategies.apiStrategy).then(async (response) => {
      callback(undefined, response, await response.text());
    }).catch((e) => {
      callback(e);
    });
  }

  async makeSoapRequest(endpoint, soapMessage, soapAction) {
    await new Promise((resolve, reject) => {
      this.request(endpoint, soapMessage.toXmlString(), (err, response, body) => {
        if (err) {
          reject(err);
        } else {
          resolve(body);
        }
      }, { SOAPAction: soapAction, 'content-type': soapMessage.contentType });
    });
  }
}

class SecureAccessWebServiceClient {
  constructor(httpClient, endpoint, targetNamespace, provisionUserAction, provisionGroupAction, provisionOrganisationAction, username, password, requireAddressing, correlationId) {
    this._httpClient = httpClient;
    this._endpoint = endpoint;
    this._targetNamespace = targetNamespace;
    this._provisionUserAction = provisionUserAction;
    this._provisionGroupAction = provisionGroupAction;
    this._provisionOrganisationAction = provisionOrganisationAction;
    this._username = username;
    this._password = password;
    this._requireAddressing = requireAddressing;
    this._correlationId = correlationId;

    this._provisionUserFormatter = new ProvisionUserDefaultFormatter();
    this._provisionOrganisationFormatter = new ProvisionOrganisationDefaultFormatter();
    this._provisionGroupFormatter = new ProvisionGroupDefaultFormatter();
  }

  setProvisionUserFormatter(type) {
    if (!type || type.toLowerCase() === 'default') {
      this._provisionUserFormatter = new ProvisionUserDefaultFormatter();
    } else if (type.toLowerCase() === 'collect') {
      this._provisionUserFormatter = new ProvisionUserCollectFormatter();
    } else if (type.toLowerCase() === 'dqt') {
      this._provisionUserFormatter = new ProvisionUserDQTFormatter();
    } else if (type.toLowerCase() === 's2s') {
      this._provisionUserFormatter = new ProvisionUserS2SFormatter();
    }
  }

  setProvisionOrganisationFormatter(type) {
    if (!type || type.toLowerCase() === 'default') {
      this._provisionOrganisationFormatter = new ProvisionOrganisationDefaultFormatter();
    } else if (type.toLowerCase() === 'collect') {
      this._provisionOrganisationFormatter = new ProvisionOrganisationCollectFormatter();
    } else if (type.toLowerCase() === 'dqt') {
      this._provisionOrganisationFormatter = new ProvisionOrganisationDQTFormatter();
    } else if (type.toLowerCase() === 's2s') {
      this._provisionOrganisationFormatter = new ProvisionOrganisationS2SFormatter();
    }
  }

  setProvisionGroupFormatter(type) {
    if (!type || type.toLowerCase() === 'default') {
      this._provisionGroupFormatter = new ProvisionGroupDefaultFormatter();
    } else if (type.toLowerCase() === 'collect') {
      this._provisionGroupFormatter = new ProvisionGroupCollectFormatter();
    } else if (type.toLowerCase() === 's2s') {
      this._provisionGroupFormatter = new ProvisionGroupS2SFormatter();
    }
  }

  async provisionUser(action, saUserId, saUsername, firstName, lastName, emailAddress, organisationId, wsAccountStatusCode, establishmentUrn, localAuthorityCode, groupUpdates, organisationUid) {
    const message = this._provisionUserFormatter.getProvisionUserSoapMessage(this._targetNamespace, action, saUserId, saUsername, firstName, lastName, emailAddress, organisationId, wsAccountStatusCode, establishmentUrn, localAuthorityCode, groupUpdates, organisationUid);
    if (this._username) {
      message.setUsernamePassword(this._username, this._password).setTimestamp(60);
    }
    if (this._requireAddressing) {
      message.setAddressing(this._endpoint, this._provisionUserAction);
    }

    await this._httpClient.makeSoapRequest(this._endpoint, message, this._provisionUserAction);
  }

  async provisionGroup(action, id, code, name, status, parentId, parentCode) {
    const message = this._provisionGroupFormatter.getProvisionGroupSoapMessage(this._targetNamespace, action, id, code, name, status, parentId, parentCode);
    if (this._username) {
      message.setUsernamePassword(this._username, this._password).setTimestamp(60);
    }
    if (this._requireAddressing) {
      message.setAddressing(this._endpoint, this._provisionGroupAction);
    }

    await this._httpClient.makeSoapRequest(this._endpoint, message, this._provisionGroupAction);
  }

  async provisionOrganisation(action, establishmentDfeNumber, establishmentUrn, establishmentNumber, groupUid, localAuthorityCode, localAuthorityName, orgEdubaseTypeCode, organisationId, organisationName, organisationTypeCode, wsOrganisationStatusCode, regionCode, telephoneNumber) {
    const message = this._provisionOrganisationFormatter.getProvisionOrganisationSoapMessage(this._targetNamespace, action, establishmentDfeNumber, establishmentUrn, establishmentNumber, groupUid, localAuthorityCode, localAuthorityName, orgEdubaseTypeCode, organisationId, organisationName, organisationTypeCode, wsOrganisationStatusCode, regionCode, telephoneNumber);
    if (this._username) {
      message.setUsernamePassword(this._username, this._password).setTimestamp(60);
    }
    if (this._requireAddressing) {
      message.setAddressing(this._endpoint, this._provisionOrganisationAction);
    }

    await this._httpClient.makeSoapRequest(this._endpoint, message, this._provisionOrganisationAction);
  }

  static async create(wsdlUri, username, password, requireAddressing, correlationId) {
    const httpClient = new SoapHttpClient(correlationId);

    const getOperationSoapAction = (wsdl, operationName) => {
      const addressingNamespaces = ['http://www.w3.org/2006/05/addressing/wsdl'];
      const addressingPrefix = Object.keys(wsdl.definitions.$).find((key) => {
        const value = wsdl.definitions.$[key];
        return key.startsWith('xmlns:') && addressingNamespaces.find(ns => ns === value);
      }).substr(6);
      const operations = wsdl.definitions.portType[0].operation;
      const operation = operations.find(o => o.$.name === operationName);
      if (!operation) {
        return undefined;
      }
      return operation.input[0].$[`${addressingPrefix}:Action`];
    };
    const wsdl = await new Promise((resolve, reject) => {
      httpClient.request(wsdlUri, undefined, (wsdlErr, response, body) => {
        if (wsdlErr) {
          return reject(wsdlErr);
        }
        parseXmlString(body, {
          tagNameProcessors: [stripPrefix]
        }, (err, result) => {
          if (err) {
            reject(err);
          } else {
            resolve(result);
          }
        });
      });
    });

    const tns = wsdl.definitions.$.targetNamespace;
    const provisionUserAction = getOperationSoapAction(wsdl, 'ProvisionUser');
    const provisionGroupAction = getOperationSoapAction(wsdl, 'ProvisionGroup');
    const provisionOrganisationAction = getOperationSoapAction(wsdl, 'ProvisionOrganisation');
    const endpoint = wsdl.definitions.service[0].port[0].address[0].$.location;

    return new SecureAccessWebServiceClient(httpClient, endpoint, tns, provisionUserAction, provisionGroupAction, provisionOrganisationAction, username, password, requireAddressing, correlationId);
  }
}

module.exports = SecureAccessWebServiceClient;
