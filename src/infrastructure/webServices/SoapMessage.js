const { v4:uuid } = require('uuid');
const xmlescape = require('xml-escape');

const expandTreeToXml = (item, supportsNil) => {
  if (!item) {
    return '';
  }

  const keys = Object.keys(item);
  let xml = '';
  keys.forEach((key) => {
    const value = item[key];
    if (value === undefined || (value === null && !supportsNil)) {
      return;
    }

    const tag = key.indexOf(':') > -1 ? key : `ws:${key}`;
    const isObject = typeof (value) === 'object';
    const isArray = value instanceof Array;
    const isDate = value instanceof Date;

    if (value === null) {
      xml += `<${tag} xsi:nil="true" />`;
    } else {
      xml += `<${tag}>`;
      if (isArray) {
        for (let i = 0; i < value.length; i += 1) {
          xml += expandTreeToXml(value[i], supportsNil);
        }
      } else if (isDate) {
        xml += value.toISOString();
      } else if (isObject) {
        xml += expandTreeToXml(value, supportsNil);
      } else {
        xml += xmlescape((value || '').toString());
      }
      xml += `</${tag}>`;
    }
  });
  return xml;
};

class SoapMessage {
  constructor(targetNamespace, soapNamespace = 'http://schemas.xmlsoap.org/soap/envelope/', supportsNil = true) {
    this._targetNamespace = targetNamespace;
    this._soapNamespace = soapNamespace;
    this._supportsNil = supportsNil;
    this._namespaces = [];
    this._contentType = 'text/xml;charset=UTF-8';
  }

  get contentType() {
    return this._contentType;
  }

  set contentType(value) {
    this._contentType = value;
  }

  setAddressing(to, action) {
    this._to = to;
    this._action = action;
    return this;
  }

  setUsernamePassword(username, password) {
    this._username = username;
    this._password = password;
    return this;
  }

  setTimestamp(secondToLive) {
    this._ttl = secondToLive * 1000;
    return this;
  }

  addNamespace(alias, uri) {
    this._namespaces.push({ alias, uri });
    return this;
  }

  setBody(body) {
    this._body = body;
    return this;
  }

  toXmlString() {
    const now = new Date();
    let xml = `<soapenv:Envelope xmlns:soapenv="${this._soapNamespace}" xmlns:ws="${this._targetNamespace}"`;
    if (this._supportsNil) {
      xml += ' xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"';
    }
    if (this._to || this._action) {
      xml += ' xmlns:wsa="http://www.w3.org/2005/08/addressing"'
    }
    this._namespaces.forEach(ns => xml += ` xmlns:${ns.alias}="${ns.uri}"`);
    xml += '>';

    const hasSecurityHeaders = this._username || this._password || this._ttl;
    const hasAddressingHeaders = this._action || this._to;
    const hasHeaders = hasSecurityHeaders || hasAddressingHeaders;
    if (hasHeaders) {
      xml += '<soapenv:Header>';

      if (hasSecurityHeaders) {
        xml += '<wsse:Security xmlns:wsse="http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-wssecurity-secext-1.0.xsd" xmlns:wsu="http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-wssecurity-utility-1.0.xsd">';

        if (this._ttl) {
          const expires = new Date(now.getTime() + this._ttl);
          const id = uuid().replace(/\-/g, '').toUpperCase();

          xml += `<wsu:Timestamp wsu:Id="TS-${id}">`;
          xml += `<wsu:Created>${now.toISOString()}</wsu:Created>`;
          xml += `<wsu:Expires>${expires.toISOString()}</wsu:Expires>`;
          xml += '</wsu:Timestamp>';
        }

        if (this._username) {
          const id = uuid().replace(/\-/g, '').toUpperCase();

          xml += `<wsse:UsernameToken wsu:Id="UsernameToken-${id}">`;
          xml += `<wsse:Username>${xmlescape(this._username)}</wsse:Username>`;
          xml += `<wsse:Password Type="http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-username-token-profile-1.0#PasswordText">${xmlescape(this._password)}</wsse:Password>`;
          xml += '</wsse:UsernameToken>';
        }

        xml += '</wsse:Security>';
      }

      if (this._to) {
        xml += `<wsa:To>${this._to}</wsa:To>`;
      }
      if (this._action) {
        xml += `<wsa:Action>${this._action}</wsa:Action>`;
      }

      xml += '</soapenv:Header>';
    }

    xml += `<soapenv:Body>${expandTreeToXml(this._body, this._supportsNil)}</soapenv:Body>`;

    return `${xml}</soapenv:Envelope>`;
  }
}

module.exports = SoapMessage;
