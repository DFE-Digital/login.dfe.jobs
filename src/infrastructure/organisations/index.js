const ApiClient = require('./../ApiClient');

class OrganisatonsClient extends ApiClient {
  constructor(opts, correlationId) {
    super(opts, correlationId);
  }

  async getOrgRequestById(requestId) {
    return this._callApi(`/organisations/requests/${requestId}`);
  }

  async getApproversForOrganisation(organisationId) {
    return this._callApi(`/organisations/${organisationId}/approvers`);
  }

  async getOrganisationById(organisationId) {
    return this._callApi(`/organisations/v2/${organisationId}`);
  }

  async addOrganisationToInvitation(invitationId, organisationId, roleId) {
    return this._callApi(`/organisations/${organisationId}/invitations/${invitationId}`, 'PUT', { roleId });
  }

  async addOrganisationToUser(userId, organisationId, roleId) {
    return this._callApi(`/organisations/${organisationId}/users/${userId}`, 'PUT', { roleId });
  }

  async listUserOrganisations(userId) {
    return this._callApi(`/organisations/v2/associated-with-user/${userId}`);
  }
}

module.exports = OrganisatonsClient;
