jest.mock('../../../../src/infrastructure/notify');

const { getNotifyAdapter } = require('../../../../src/infrastructure/notify');
const { getHandler } = require('../../../../src/handlers/notifications/changeProfile/verifyChangeEmailV1');

const config = {
  notifications: {
    profileUrl: 'https://profile.dfe.signin',
  },
};
const jobData = {
  firstName: 'User',
  lastName: 'One',
  email: 'user.one@unit.tests',
  code: 'ABC123',
};

describe('When handling verifychangeemail_v1 job', () => {
  const mockSendEmail = jest.fn();

  beforeEach(() => {
    mockSendEmail.mockReset();

    getNotifyAdapter.mockReset();
    getNotifyAdapter.mockReturnValue({ sendEmail: mockSendEmail });
  });

  it('then it should return a handler with a processor', () => {
    const handler = getHandler(config);

    expect(handler).not.toBeNull();
    expect(handler.type).toBe('verifychangeemail_v1');
    expect(handler.processor).not.toBeNull();
    expect(handler.processor).toBeInstanceOf(Function);
  });

  it('then it should get email adapter with supplied config', async () => {
    const handler = getHandler(config);

    await handler.processor(jobData);

    expect(getNotifyAdapter).toHaveBeenCalledTimes(1);
    expect(getNotifyAdapter).toHaveBeenCalledWith(config);
  });

  it('then it should send email with expected template', async () => {
    const handler = getHandler(config);

    await handler.processor(jobData);

    expect(mockSendEmail).toHaveBeenCalledTimes(1);
    expect(mockSendEmail).toHaveBeenCalledWith(
      'verifyChangeEmailAddress',
      expect.anything(),
      expect.anything(),
    );
  });

  it('then it should send email to users email address', async () => {
    const handler = getHandler(config);

    await handler.processor(jobData);

    expect(mockSendEmail).toHaveBeenCalledTimes(1);
    expect(mockSendEmail).toHaveBeenCalledWith(
      expect.anything(),
      jobData.email,
      expect.anything(),
    );
  });

  it('then it should send email using request data as model', async () => {
    const handler = getHandler(config);

    await handler.processor(jobData);

    expect(mockSendEmail).toHaveBeenCalledTimes(1);
    expect(mockSendEmail).toHaveBeenCalledWith(
      expect.anything(),
      expect.anything(),
      expect.objectContaining({
        personalisation: expect.objectContaining({
          firstName: jobData.firstName,
          lastName: jobData.lastName,
          email: jobData.email,
          code: jobData.code,
          returnUrl: 'https://profile.dfe.signin/change-email/verify',
        }),
      }),
    );
  });

  it('then it should use return url including uid if present in data', async () => {
    jobData.uid = 'user1';

    const handler = getHandler(config);

    await handler.processor(jobData);

    expect(mockSendEmail).toHaveBeenCalledTimes(1);
    expect(mockSendEmail).toHaveBeenCalledWith(
      expect.anything(),
      expect.anything(),
      expect.objectContaining({
        personalisation: expect.objectContaining({
          firstName: jobData.firstName,
          lastName: jobData.lastName,
          email: jobData.email,
          code: jobData.code,
          returnUrl: 'https://profile.dfe.signin/change-email/user1/verify',
        }),
      }),
    );
  });
});
