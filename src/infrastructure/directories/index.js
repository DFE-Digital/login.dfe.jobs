const ApiClient = require("./../ApiClient");

class DirectoriesClient extends ApiClient {
  constructor(opts, correlationId) {
    super(opts, correlationId);
  }

  async updateInvitation(invitation) {
    return this._callApi(`/invitations/${invitation.id}`, "PATCH", {
      callbacks: invitation.callbacks,
    });
  }
}

module.exports = DirectoriesClient;
