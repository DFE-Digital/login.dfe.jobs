const DiskEmailAdapter = require('./DiskEmailAdapter');
const S3EmailAdapter = require('./S3EmailAdapter');
const SESEmailAdapter = require('./SESEmailAdapter');

const getEmailAdapter = (config, logger) => {
  const type = (config.notifications && config.notifications.email && config.notifications.email.type) ? config.notifications.email.type.toLowerCase() : 'disk';

  if (type === 'disk') {
    return new DiskEmailAdapter(config, logger);
  } else if (type === 's3') {
    return new S3EmailAdapter(config, logger);
  } else if (type === 'ses') {
    return new SESEmailAdapter(config, logger);
  } else {
    logger.error(`Unknown email type from email adapter ${config.notifications.email.type}`);
    throw new Error(`Unknown email type ${config.notifications.email.type}`);
  }
};

module.exports = {
  getEmailAdapter,
};
