const logger = require('../logger');

class MonitorComposite {
  constructor(monitors) {
    this.monitors = monitors;
    this.status = 'stopped';
  }

  start() {
    logger.info('MonitorComposite: starting monitors');
    this.monitors.forEach((monitor) => monitor.start());
    this.status = 'started';
  }

  async stop() {
    logger.info('MonitorComposite: stopping monitors');
    const stopPromises = this.monitors.map((monitor) => monitor.stop());
    await Promise.all(stopPromises);
    this.status = 'stopped';
  }

  get currentStatus() {
    return this.status;
  }
}

module.exports = MonitorComposite;
