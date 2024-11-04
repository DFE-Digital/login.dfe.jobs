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

  async getUser(userId) {
    return this._callApi(`/users/${userId}`);
  }

  async getUserByEmail(email) {
    return this._callApi(`/users/${email}`);
  }

  async getInvitationByEmail(email) {
    return this._callApi(`/invitations/by-email/${email}`);
  }

  async createInvitation(invitation) {
    return this._callApi('/invitations', 'POST', invitation);
  }

  async updateInvitation(invitation) {
    return this._callApi(`/invitations/${invitation.id}`, 'PATCH', {
      callbacks: invitation.callbacks,
    });
  }
}

module.exports = DirectoriesClient;
