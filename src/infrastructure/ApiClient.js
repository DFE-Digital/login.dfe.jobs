const jwtStrategy = require('login.dfe.jwt-strategies');
const { fetchApi } = require('login.dfe.async-retry');

class ApiClient {
  constructor(opts, correlationId) {
    this.opts = opts.service;
    this.token = undefined;
    this.correlationId = correlationId;
  }

  async _ensureToken() {
    if (!this.token) {
      this.token = await jwtStrategy(this.opts).getBearerToken();
    }
  }

  async _callApi(resource, method = 'GET', body = undefined) {
    await this._ensureToken();

    let uri = this.opts.url.endsWith('/')
      ? `${this.opts.url.substr(0, this.opts.url.length - 1)}${resource}`
      : `${this.opts.url}${resource}`;

    try {
      return await fetchApi(uri, {
        method,
        headers: {
          'x-correlation-id': this.correlationId,
          'authorization': `bearer ${this.token}`,
        },
        body
      })
    } catch (e) {
      const status = e.statusCode || 500;
      if (status === 404) {
        return undefined;
      }
      throw e;
    }
  }
}

module.exports = ApiClient;
