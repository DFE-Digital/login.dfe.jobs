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
}

module.exports = OrganisatonsClient;
