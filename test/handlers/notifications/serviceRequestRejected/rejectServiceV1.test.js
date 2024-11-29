jest.mock('../../../../src/infrastructure/notify');
const { getNotifyAdapter } = require('../../../../src/infrastructure/notify');
const { getHandler } = require('../../../../src/handlers/notifications/serviceRequestRejected/rejectServiceV1');

const config = {
  notifications: {
    servicesUrl: 'https://services.dfe.signin',
    helpUrl: 'https://help.dfe.signin',
  },
};

const data = {
  email: 'user.one@unit.test',
  firstName: 'mock-firstName',
  lastName: 'mock-lastName',
  serviceName: 'mock-serviceName',
  orgName: 'mock-orgName',
  requestedSubServices: ['mock-requestedSubServices-role1'],
  reason: 'mock-reason',
  signInUrl: 'https://services.dfe.signin/my-services',
};

describe('when processing a userservicerejected_v1 job', () => {
  const mockSendEmail = jest.fn();

  beforeEach(() => {
    mockSendEmail.mockReset();

    getNotifyAdapter.mockReset();
    getNotifyAdapter.mockReturnValue({ sendEmail: mockSendEmail });
  });

  it('should return a handler with a processor', async () => {
    const handler = getHandler(config);

    expect(handler).not.toBeNull();
    expect(handler.type).toBe('userservicerejected_v1');
    expect(handler.processor).not.toBeNull();
    expect(handler.processor).toBeInstanceOf(Function);
  });

  it('should get email adapter with supplied config', async () => {
    const handler = getHandler(config);

    await handler.processor(data);

    expect(getNotifyAdapter).toHaveBeenCalledTimes(1);
    expect(getNotifyAdapter).toHaveBeenCalledWith(config);
  });

  it('should send email with expected template', async () => {
    const handler = getHandler(config);

    await handler.processor(data);

    expect(mockSendEmail).toHaveBeenCalledTimes(1);
    expect(mockSendEmail).toHaveBeenCalledWith(
      'userRequestForServiceRejected',
      expect.anything(),
      expect.anything(),
    );
  });

  it('should send email to users email address', async () => {
    const handler = getHandler(config);

    await handler.processor(data);

    expect(mockSendEmail).toHaveBeenCalledTimes(1);
    expect(mockSendEmail).toHaveBeenCalledWith(
      expect.anything(),
      data.email,
      expect.anything(),
    );
  });

  it.each([
    [null, '', false], [undefined, '', false], ['', '', false], [' ', '', false], [data.reason, data.reason, true],
  ])('should send an email with expected personalisation data, when the reason is "%s" it should be "%s" and the header should be visible %s', async (reasonText, expectedReasonText, expectedShowReasonHeader) => {
    const handler = getHandler(config);

    const jobData = { ...data, ...{ reason: reasonText } };
    await handler.processor(jobData);

    expect(mockSendEmail).toHaveBeenCalledTimes(1);
    expect(mockSendEmail).toHaveBeenCalledWith(
      expect.anything(),
      expect.anything(),
      expect.objectContaining({
        personalisation: expect.objectContaining({
          firstName: data.firstName,
          lastName: data.lastName,
          serviceName: data.serviceName,
          orgName: data.orgName,
          requestedSubServices: data.requestedSubServices,
          reason: expectedReasonText,
          signInUrl: data.signInUrl,
          showReasonHeader: expectedShowReasonHeader,
          helpUrl: `${config.notifications.helpUrl}/contact-us`,
        }),
      }),
    );
  });
});
