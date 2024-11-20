jest.mock('../../../../src/infrastructure/notify');
jest.mock('uuid', () => {
  return {
    v4: jest.fn().mockReturnValue('750f050d-6861-419b-b089-1b78c4db2611')
  }
});

const { getNotifyAdapter } = require('../../../../src/infrastructure/notify');
const { getHandler } = require('../../../../src/handlers/notifications/passwordReset/passwordResetV1.js');

const config = {
  notifications: {
    interactionsUrl: 'https://interactions.test',
    helpUrl: 'https://help.url',
  },
};
const jobData = {
  email: 'user.one@unit.test',
  firstName: 'Jane',
  lastName: 'Doe',
  code: 'TEST01',
  clientId: 'CLIENT1',
  uid: '65432RFV',
};

describe('when processing a passwordreset_v1 job', () => {
  const mockSendEmail = jest.fn();

  beforeEach(() => {
    mockSendEmail.mockReset();

    getNotifyAdapter.mockReset();
    getNotifyAdapter.mockReturnValue({ sendEmail: mockSendEmail });
  });

  it('should return a handler with a processor', () => {
    const handler = getHandler(config);

    expect(handler).not.toBeNull();
    expect(handler.type).toBe('passwordreset_v1');
    expect(handler.processor).not.toBeNull();
    expect(handler.processor).toBeInstanceOf(Function);
  });

  it('should get email adapter with supplied config', async () => {
    const handler = getHandler(config);

    await handler.processor(jobData);

    expect(getNotifyAdapter).toHaveBeenCalledTimes(1);
    expect(getNotifyAdapter).toHaveBeenCalledWith(config);
  });

  it('should send email with expected template', async () => {
    const handler = getHandler(config);

    await handler.processor(jobData);

    expect(mockSendEmail).toHaveBeenCalledTimes(1);
    expect(mockSendEmail).toHaveBeenCalledWith(
      'verifyPasswordResetRequest',
      expect.anything(),
      expect.anything(),
    );
  });

  it('should send email to users email address', async () => {
    const handler = getHandler(config);

    await handler.processor(jobData);

    expect(mockSendEmail).toHaveBeenCalledTimes(1);
    expect(mockSendEmail).toHaveBeenCalledWith(
      expect.anything(),
      jobData.email,
      expect.anything(),
    );
  });

  it('should send email with expected personalisation data', async () => {
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
          code: jobData.code,
          returnUrl: 'https://interactions.test/750f050d-6861-419b-b089-1b78c4db2611/resetpassword/65432RFV/confirm?clientid=CLIENT1',
          helpUrl: 'https://help.url/contact-us',
        }),
      }),
    );
  });
});
