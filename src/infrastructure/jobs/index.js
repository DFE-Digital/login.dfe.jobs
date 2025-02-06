const { bullEnqueue } = require("../../infrastructure/jobQueue/BullHelpers");

class JobsClient {
  constructor() {}

  async queueNotifyRelyingParty(callback, userId, sourceId, state, clientId) {
    await bullEnqueue("publicinvitationnotifyrelyingparty_v1", {
      userId,
      sourceId,
      callback,
      state,
      clientId,
    });
  }
}

module.exports = JobsClient;
