jest.mock('../../../../src/infrastructure/email');

const { getEmailAdapter } = require('../../../../src/infrastructure/email');
const { getHandler } = require('../../../../src/handlers/notifications/changeProfile/verifyChangeEmailV1');
const emailSend = jest.fn();

const config = {
  notifications: {
    profileUrl: 'https://profile.dfe.signin',
  },
};
const logger = {};
const jobData = {
  firstName: 'User',
  lastName: 'One',
  email: 'user.one@unit.tests',
  code: 'ABC123',
};

describe('When handling verifychangeemail_v1 job', () => {
  beforeEach(() => {
    emailSend.mockReset();

    getEmailAdapter.mockReset();
    getEmailAdapter.mockReturnValue({ send: emailSend });
  });

  it('then it should return a handler with a processor', () => {
    const handler = getHandler(config, logger);

    expect(handler).not.toBeNull();
    expect(handler.type).toBe('verifychangeemail_v1');
    expect(handler.processor).not.toBeNull();
    expect(handler.processor).toBeInstanceOf(Function);
  });

  it('then it should get email adapter with supplied config and logger', async () => {
    const handler = getHandler(config, logger);

    await handler.processor(jobData);

    expect(getEmailAdapter.mock.calls).toHaveLength(1);
    expect(getEmailAdapter.mock.calls[0][0]).toBe(config);
    expect(getEmailAdapter.mock.calls[0][1]).toBe(logger);
  });

  it('then it should send email to users email address', async () => {
    const handler = getHandler(config, logger);

    await handler.processor(jobData);

    expect(emailSend.mock.calls).toHaveLength(1);
    expect(emailSend.mock.calls[0][0]).toBe(jobData.email);
  });

  it('then it should send email using verify-change-email template', async () => {
    const handler = getHandler(config, logger);

    await handler.processor(jobData);

    expect(emailSend.mock.calls).toHaveLength(1);
    expect(emailSend.mock.calls[0][1]).toBe('verify-change-email');
  });

  it('then it should send email using request data as model', async () => {
    const handler = getHandler(config, logger);

    await handler.processor(jobData);

    expect(emailSend.mock.calls).toHaveLength(1);
    expect(emailSend.mock.calls[0][2]).toEqual({
      firstName: jobData.firstName,
      lastName: jobData.lastName,
      email: jobData.email,
      code: jobData.code,
      returnUrl: 'https://profile.dfe.signin/change-email/verify',
    });
  });

  it('then it should use return url including uid if present in data', async () => {
    jobData.uid = 'user1';

    const handler = getHandler(config, logger);

    await handler.processor(jobData);

    expect(emailSend.mock.calls).toHaveLength(1);
    expect(emailSend.mock.calls[0][2]).toEqual({
      firstName: jobData.firstName,
      lastName: jobData.lastName,
      email: jobData.email,
      code: jobData.code,
      returnUrl: 'https://profile.dfe.signin/change-email/user1/verify',
    });
  });

  it('then it should send email with subject', async () => {
    const handler = getHandler(config, logger);

    await handler.processor(jobData);

    expect(emailSend.mock.calls).toHaveLength(1);
    expect(emailSend.mock.calls[0][3]).toBe('Verify your new DfE Sign-in email address');
  });
});
