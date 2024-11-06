jest.mock('../../../../src/infrastructure/email');

const { getEmailAdapter } = require('../../../../src/infrastructure/email');
const { getHandler } = require('../../../../src/handlers/notifications/registration/registerExistingUserV1');

const send = jest.fn();
const logger = {
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};
const config = {
  notifications: {
    migrationUrl: 'https://profile.test/reg',
  },
};

describe('when sending v1 existing user registration', () => {
  let data;
  let handler;

  beforeEach(() => {
    send.mockReset();
    getEmailAdapter.mockReset().mockReturnValue({
      send,
    });

    data = {
      email: 'stephen.strange@new-avengers.test',
      firstName: 'Stephen',
      lastName: 'Strange',
      serviceName: 'Unit Test',
      returnUrl: 'https://some.service.test/register/complete?outcome=acount_exists'
    };

    handler = getHandler(config, logger);
  });

  it('then it should send email using registerexistinguser template', async () => {
    await handler.processor(data);

    expect(send.mock.calls).toHaveLength(1);
    expect(send.mock.calls[0][1]).toBe('registerexistinguser');
  });

  it('then it should send email to email address in data', async () => {
    await handler.processor(data);

    expect(send.mock.calls).toHaveLength(1);
    expect(send.mock.calls[0][0]).toBe(data.email);
  });


  it('then it should use register subject line', async () => {
    await handler.processor(data);

    expect(send.mock.calls).toHaveLength(1);
    expect(send.mock.calls[0][3]).toBe(`You’ve registered to join ${data.serviceName}`);
  });

  it('then it should send email using template data', async () => {
    await handler.processor(data);

    expect(send.mock.calls).toHaveLength(1);
    expect(send.mock.calls[0][2]).toEqual({
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email,
      serviceName: data.serviceName,
      returnUrl: data.returnUrl,
    });
  });
});
