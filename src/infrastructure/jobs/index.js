const kue = require('login.dfe.kue');

const send = async (type, data, connectionString) => {
  return new Promise((resolve, reject) => {
    const queue = kue.createQueue({
      redis: connectionString
    });
    queue.create(type, data)
      .save((err) => {
        if (err) {
          reject(err);
        } else {
          resolve(err);
        }
        try {
          queue.shutdown();
        } catch (e) {
        }
      });
  });
};

class JobsClient {
  constructor(connectionString) {
    this.connectionString = connectionString;
  }

  async queueNotifyRelyingParty(callback, userId, sourceId, state, clientId) {
    await send('publicinvitationnotifyrelyingparty_v1', {
      userId,
      sourceId,
      callback,
      state,
      clientId,
    }, this.connectionString);
  }
}

module.exports = JobsClient;
