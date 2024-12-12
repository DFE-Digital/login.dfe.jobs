const MonitorComposite = require('../../../src/infrastructure/jobQueue/MonitorComposite');
const MonitorBull = require('../../../src/infrastructure/jobQueue/MonitorBull');
const logger = require('../../../src/infrastructure/logger/index');

jest.mock('../../../src/infrastructure/logger', () => ({
  info: jest.fn(),
  error: jest.fn(),
  debug: jest.fn(),
}));

jest.mock('../../../src/infrastructure/config', () => ({
  queueStorage: {
    connectionString: '',
  },
}));

describe('MonitorComposite', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should set its currentStatus to be started', async () => {
    const compositeInstance = new MonitorComposite([]);
    compositeInstance.start();
    expect(compositeInstance.currentStatus).toBe('started');
    expect(logger.info).toHaveBeenCalledWith('MonitorComposite: starting monitors');
  });

  it('should set its currentStatus to be stopped', async () => {
    const compositeInstance = new MonitorComposite([]);
    await compositeInstance.stop();
    expect(compositeInstance.currentStatus).toBe('stopped');
    expect(logger.info).toHaveBeenCalledWith('MonitorComposite: stopping monitors');
  });

  it('should call the start method of bullmq', async () => {
    const bullInstance = new MonitorBull([]);
    const bullStart = jest.spyOn(bullInstance, 'start');
    const compositeInstance = new MonitorComposite([bullInstance]);

    compositeInstance.start();
    expect(bullStart).toHaveBeenCalledTimes(1);
    expect(bullInstance.currentStatus).toBe('started');
  });

  it('calls the stop method of bullmq', async () => {
    const bullInstance = new MonitorBull([]);
    const bullStop = jest.spyOn(bullInstance, 'stop');
    const compositeInstance = new MonitorComposite([bullInstance]);

    await compositeInstance.stop();
    expect(bullStop).toHaveBeenCalledTimes(1);
    expect(bullInstance.currentStatus).toBe('stopped');
  });
});
