const ApiClient = require('./../ApiClient');

class ApplicationsClient extends ApiClient {
  constructor(opts, correlationId) {
    super(opts, correlationId);
  }

  async getApplication(idOrClientId) {
    return this._callApi(`/services/${idOrClientId}`);
  }
}

module.exports = ApplicationsClient;
