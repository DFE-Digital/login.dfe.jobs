const ApiClient = require('./../ApiClient');

class DirectoriesClient extends ApiClient {
  constructor(opts, correlationId) {
    super(opts, correlationId);
  }

  async getUsersByIds(ids) {
    return this._callApi('/users/by-ids', 'POST', {
      ids: ids.toString(),
    });
  };

  async getById(id) {
    return this._callApi(`/users/${id}`)
  }
}

module.exports = DirectoriesClient;
