const GovNotifyAdapter = require('./GovNotifyAdapter');

function getNotifyAdapter(config) {
  return new GovNotifyAdapter(config);
}

module.exports = {
  getNotifyAdapter,
};
