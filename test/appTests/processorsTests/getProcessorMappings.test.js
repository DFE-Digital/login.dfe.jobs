jest.mock('login.dfe.migration.admin.job');
jest.mock('login.dfe.notification.jobs');
jest.mock('login.dfe.service-notifications.jobs');

const { getProcessorMappings } = require('./../../../src/app/processors');

const config = {
  key: 'value'
};
const logger = {
  info: () => {},
};

describe('when getting processor mappings', () => {
  let migrationAdminRegister;
  let notificationsRegister;
  let serviceNotificationsRegister;

  beforeEach(() => {
    migrationAdminRegister = jest.fn().mockReturnValue([
      {
        type: 'migrationAdmin1',
        processor: () => {
        }
      },
      {
        type: 'migrationAdmin2',
        processor: () => {
        }
      },
    ]);
    const migrationAdmin = require('login.dfe.migration.admin.job');
    migrationAdmin.register = migrationAdminRegister;

    notificationsRegister = jest.fn().mockReturnValue([
      {
        type: 'notifications1',
        processor: () => {
        }
      },
      {
        type: 'notifications2',
        processor: () => {
        }
      },
    ]);
    const notifications = require('login.dfe.notification.jobs');
    notifications.register = notificationsRegister;

    serviceNotificationsRegister = jest.fn().mockReturnValue([
      {
        type: 'servicenotifications1',
        processor: () => {
        }
      },
      {
        type: 'servicenotifications2',
        processor: () => {
        }
      },
    ]);
    const serviceNotifications = require('login.dfe.service-notifications.jobs');
    serviceNotifications.register = serviceNotificationsRegister;
  });

  it('then it should return an array of processors', async () => {
    const actual = await getProcessorMappings(config, logger);

    expect(actual).not.toBeNull();
    expect(actual).toBeDefined();
    expect(actual).toBeInstanceOf(Array);
  });

  it('then it should register test processor', async () => {
    const actual = await getProcessorMappings(config, logger);

    expect(actual.find((x) => x.type === 'test')).toBeDefined();
  });

  it('then it should register migration admin processors', async () => {
    const actual = await getProcessorMappings(config, logger);

    expect(migrationAdminRegister.mock.calls.length).toBe(1);
    expect(migrationAdminRegister.mock.calls[0][0]).toBe(config);
    expect(migrationAdminRegister.mock.calls[0][1]).toBe(logger);
    expect(actual.find((x) => x.type === 'migrationAdmin1')).toBeDefined();
    expect(actual.find((x) => x.type === 'migrationAdmin2')).toBeDefined();
  });

  it('then it should register notification processors', async () => {
    const actual = await getProcessorMappings(config, logger);

    expect(notificationsRegister.mock.calls.length).toBe(1);
    expect(notificationsRegister.mock.calls[0][0]).toBe(config);
    expect(notificationsRegister.mock.calls[0][1]).toBe(logger);
    expect(actual.find((x) => x.type === 'notifications1')).toBeDefined();
    expect(actual.find((x) => x.type === 'notifications2')).toBeDefined();
  });

  it('then it should register service notification processors', async () => {
    const actual = await getProcessorMappings(config, logger);

    expect(notificationsRegister.mock.calls.length).toBe(1);
    expect(notificationsRegister.mock.calls[0][0]).toBe(config);
    expect(notificationsRegister.mock.calls[0][1]).toBe(logger);
    expect(actual.find((x) => x.type === 'servicenotifications1')).toBeDefined();
    expect(actual.find((x) => x.type === 'servicenotifications2')).toBeDefined();
  });
});