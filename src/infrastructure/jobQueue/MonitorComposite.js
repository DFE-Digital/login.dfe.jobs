const logger = require('../logger');

class MonitorComposite {
  constructor(monitors) {
    this.monitors = monitors;
  }

  start() {
    logger.info('MonitorComposite: starting monitors');
    this.monitors.forEach((monitor) => monitor.start());
  }

  async stop() {
    logger.info('MonitorComposite: stopping monitors');
    const stopPromises = this.monitors.map((monitor) => monitor.stop());
    await Promise.all(stopPromises);
  }
}

module.exports = MonitorComposite;
