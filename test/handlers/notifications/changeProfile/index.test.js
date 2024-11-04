jest.mock('../../../../src/handlers/notifications/changeProfile/verifyChangeEmailV1');

const processor = async (data) => {
  return Promise.resolve();
};
const config = {
  notifications: {
    type: 'disk',
  },
};
const logger = {
  info: jest.fn(),
  error: jest.fn(),
};

describe('when registering change profile handlers', () => {
  let verifyChangeEmailV1;
  let register;

  beforeAll(() => {
    verifyChangeEmailV1 = require('../../../../src/handlers/notifications/changeProfile/verifyChangeEmailV1');
    verifyChangeEmailV1.getHandler = jest.fn().mockReturnValue({
      type: 'verifyChangeEmailV1',
      processor,
    });

    register = require('../../../../src/handlers/notifications/changeProfile').register;
  });

  it('then it should register the v1 handler', async () => {
    const actual = await register(config, logger);

    expect(verifyChangeEmailV1.getHandler.mock.calls.length).toBe(1);
    expect(verifyChangeEmailV1.getHandler.mock.calls[0][0]).toBe(config);
    expect(verifyChangeEmailV1.getHandler.mock.calls[0][1]).toBe(logger);

    const handler = actual.find(x => x.type === 'verifyChangeEmailV1');
    expect(handler).not.toBeNull();
  });
});
