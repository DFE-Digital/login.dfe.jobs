const config = require('./infrastructure/config');
const logger = require('./infrastructure/logger');

logger.info('started worker');
logger.info(`config: ${JSON.stringify(config)}`);