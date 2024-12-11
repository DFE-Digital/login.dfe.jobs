const express = require('express');
const { asyncWrapper } = require('login.dfe.express-error-handling');
const logger = require('../../infrastructure/logger');

const router = express.Router();

const area = () => {
  router.get('/', asyncWrapper(async (req, res) => {
    res.json({ status: req.monitor.currentStatus });
  }));

  router.patch('/', asyncWrapper(async (req, res) => {
    const requestedState = req.body.state;
    if (requestedState === 'stopped') {
      if (req.monitor.currentStatus === 'stopped') {
        return res.status(304).send();
      }

      logger.info('Stopping monitor based on api request');
      await req.monitor.stop();
      return res.send();
    }

    if (requestedState === 'started') {
      if (req.monitor.currentStatus === 'started') {
        return res.status(304).send();
      }

      logger.info('Starting monitor based on api request');
      await req.monitor.start();
      return res.send();
    }

    res.json({ status: req.monitor.currentStatus });
  }));
  return router;
};
module.exports = area;
