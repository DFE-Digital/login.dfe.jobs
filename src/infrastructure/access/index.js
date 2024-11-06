const ApiClient = require('./../ApiClient');

class AccessClient extends ApiClient {
  constructor(opts, correlationId) {
    super(opts, correlationId);
  }

  async listUserAccess(userId) {
    return this._callApi(`/users/${userId}/services`);
  }
}

module.exports = AccessClient;
