jest.mock('../../../../src/infrastructure/notify');

const { getNotifyAdapter } = require('../../../../src/infrastructure/notify');
const { getHandler } = require('../../../../src/handlers/notifications/accessRequest/approverAccessRequestV1');

const config = {
  notifications: {
    servicesUrl: 'https://services.dfe.signin',
    helpUrl: 'https://help.dfe.signin',
  },
};
const jobData = {
  orgName: 'Test Organisation',
  userName: 'Test One',
  userEmail: 'email@test.com',
  recipients: ['test1@unit', 'test2@unit'],
  orgId: 'org',
  requestId: 'requestId',
};

describe('When handling approverAccessRequest_v1 job', () => {
  const mockSendEmail = jest.fn();

  beforeEach(() => {
    mockSendEmail.mockReset();

    getNotifyAdapter.mockReset();
    getNotifyAdapter.mockReturnValue({ sendEmail: mockSendEmail });
  });
  it('should return a handler with a processor', async () => {
    const handler = getHandler(config);

    expect(handler).not.toBeNull();
    expect(handler.type).toBe('approveraccessrequest_v1');
    expect(handler.processor).not.toBeNull();
    expect(handler.processor).toBeInstanceOf(Function);
  });

  it('should get email adapter with supplied config', async () => {
    const handler = getHandler(config);

    await handler.processor(jobData);

    expect(getNotifyAdapter).toHaveBeenCalledTimes(1);
    expect(getNotifyAdapter).toHaveBeenCalledWith(config);
  });

  it.each(jobData.recipients)('should send email to user %s', async (recipient) => {
    const handler = getHandler(config);

    await handler.processor(jobData);

    expect(mockSendEmail).toHaveBeenCalledTimes(2);
    expect(mockSendEmail).toHaveBeenCalledWith(
      expect.anything(),
      recipient,
      expect.anything(),
    );
  });

  it('should send email with expected template', async () => {
    const handler = getHandler(config);

    await handler.processor(jobData);

    expect(mockSendEmail).toHaveBeenCalledTimes(2);
    expect(mockSendEmail).toHaveBeenCalledWith(
      'approverRequestAccess',
      expect.anything(),
      expect.anything(),
    );
  });

  it('should send email with expected personalisation data when the request is approved', async () => {
    const handler = getHandler(config);

    await handler.processor(jobData);

    expect(mockSendEmail).toHaveBeenCalledTimes(2);
    expect(mockSendEmail).toHaveBeenCalledWith(
      expect.anything(),
      expect.anything(),
      expect.objectContaining({
        personalisation: expect.objectContaining({
          name: jobData.userName,
          orgName: jobData.orgName,
          email: jobData.userEmail,
          returnUrl: 'https://services.dfe.signin/access-requests/organisation-requests/requestId',
          helpUrl: 'https://help.dfe.signin/contact',
        }),
      }),
    );
  });
});
