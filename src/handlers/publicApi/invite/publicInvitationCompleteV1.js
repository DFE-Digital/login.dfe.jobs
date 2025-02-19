const JobsClient = require("../../../infrastructure/jobs");

const notifyRelyingParties = async (config, data) => {
  const jobs = new JobsClient();

  for (let i = 0; i < data.callbacks.length; i++) {
    const { callback, sourceId, state, clientId } = data.callbacks[i];
    await jobs.queueNotifyRelyingParty(
      callback,
      data.userId,
      sourceId,
      state,
      clientId,
    );
  }
};

const process = async (config, logger, data) => {
  if (data.callbacks && data.callbacks.length > 0) {
    await notifyRelyingParties(config, data);
  }
};

const getHandler = (config, logger) => {
  return {
    type: "publicinvitationcomplete_v1",
    processor: async (data) => {
      await process(config, logger, data);
    },
  };
};

module.exports = {
  getHandler,
};
