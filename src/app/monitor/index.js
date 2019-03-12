const express = require('express');
const Monitor = require('./Monitor');
const logger = require('./../../infrastructure/logger');

const router = express.Router();

const area = (processorMapping) => {
  const monitor = new Monitor(processorMapping);
  monitor.start();

  const stop = () => {
    logger.info('stopping');
    monitor.stop().then(() => {
      logger.info('stopped');
      process.exit(0);
    }).catch((e) => {
      logger.error(`Error stopping - ${e}. Ending process anyway`);
      process.exit(1);
    })
  };
  process.once('SIGTERM', stop);
  process.once('SIGINT', stop);

  router.get('/', async (req, res) => {
    res.json({ status: monitor.currentStatus });
  });
  router.patch('/', async (req, res) => {
    const requestedState = req.body.state;
    if (requestedState === 'stopped') {
      if (monitor.currentStatus === 'stopped') {
        return res.status(304).send();
      }

      logger.info('Stopping monitor based on api request');
      await monitor.stop();
      return res.send();
    } else if (requestedState === 'started') {
      if (monitor.currentStatus === 'started') {
        return res.status(304).send();
      }

      logger.info('Starting monitor based on api request');
      await monitor.start();
      return res.send();
    }
    res.json({ status: monitor.currentStatus });
  });
  return router;
};
module.exports = area;
