const ApiClient = require("./../ApiClient");

class ApplicationsClient extends ApiClient {
  constructor(opts, correlationId) {
    super(opts, correlationId);
  }

  async listApplications(page, pageSize) {
    return this._callApi(`/services?page=${page}&pageSize=${pageSize}`);
  }
}

module.exports = ApplicationsClient;
