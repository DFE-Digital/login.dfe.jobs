jest.mock('../../../../src/handlers/notifications/serviceAdded/newServiceAddedV1');

const processor = async (data) => {
  return Promise.resolve();
};
const config = {
  notifications: {
    type: 'disk',
    helpUrl: 'https://help.com'
  },
};
const logger = {
  info: jest.fn(),
  error: jest.fn(),
};

describe('when registering service added handlers', () => {
  let v1;
  let register;

  beforeAll(() => {
    v1 = require('../../../../src/handlers/notifications/serviceAdded/newServiceAddedV1');
    v1.getHandler = jest.fn().mockReturnValue({
      type: 'v1',
      processor,
    });

    register = require('../../../../src/handlers/notifications/serviceAdded').register;
  });

  it('then it should register the v1 handler', async () => {
    const actual = await register(config, logger);

    expect(v1.getHandler.mock.calls.length).toBe(1);
    expect(v1.getHandler.mock.calls[0][0]).toBe(config);
    expect(v1.getHandler.mock.calls[0][1]).toBe(logger);

    const handler = actual.find(x => x.type === 'v1');
    expect(handler).not.toBeNull();
  });
});
