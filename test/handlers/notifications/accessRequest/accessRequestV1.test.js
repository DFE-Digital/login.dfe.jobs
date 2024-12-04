jest.mock('../../../../src/infrastructure/notify');
const { getNotifyAdapter } = require('../../../../src/infrastructure/notify');
const { getHandler } = require('../../../../src/handlers/notifications/accessRequest/accessRequestV1');

const config = {
  notifications: {
    servicesUrl: 'https://services.dfe.signin',
    helpUrl: 'https://help.dfe.signin',
  },
};

const jobData = {
  email: 'mock-email',
  orgName: 'Test Organisation',
  name: 'mock-name',
  approved: true,
  reason: undefined,
};

describe('when processing a accessRequest_v1 job', () => {
  const mockSendEmail = jest.fn();

  beforeEach(() => {
    mockSendEmail.mockReset();

    getNotifyAdapter.mockReset();
    getNotifyAdapter.mockReturnValue({ sendEmail: mockSendEmail });
  });

  it('should return a handler with a processor', async () => {
    const handler = getHandler(config);

    expect(handler).not.toBeNull();
    expect(handler.type).toBe('accessrequest_v1');
    expect(handler.processor).not.toBeNull();
    expect(handler.processor).toBeInstanceOf(Function);
  });

  it('should get email adapter with supplied config', async () => {
    const handler = getHandler(config);

    await handler.processor(jobData);

    expect(getNotifyAdapter).toHaveBeenCalledTimes(1);
    expect(getNotifyAdapter).toHaveBeenCalledWith(config);
  });

  it('should send email with expected template, when the request is approved', async () => {
    const handler = getHandler(config);

    await handler.processor(jobData);

    expect(mockSendEmail).toHaveBeenCalledTimes(1);
    expect(mockSendEmail).toHaveBeenCalledWith(
      'userRequestForOrganisationAccessApproved',
      expect.anything(),
      expect.anything(),
    );
  });

  it('should send email with expected template, when the request is not approved', async () => {
    const handler = getHandler(config);

    const data = { ...jobData, ...{ approved: false } };
    await handler.processor(data);

    expect(mockSendEmail).toHaveBeenCalledTimes(1);
    expect(mockSendEmail).toHaveBeenCalledWith(
      'userRequestForOrganisationAccessRejected',
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

  it('should send email with expected personalisation data when the request is approved', async () => {
    const handler = getHandler(config);

    await handler.processor(jobData);

    expect(mockSendEmail).toHaveBeenCalledTimes(1);
    expect(mockSendEmail).toHaveBeenCalledWith(
      expect.anything(),
      expect.anything(),
      expect.objectContaining({
        personalisation: expect.objectContaining({
          name: jobData.name,
          orgName: jobData.orgName,
          showReasonHeader: false,
          reason: '',
          servicesUrl: config.notifications.servicesUrl,
        }),
      }),
    );
  });

  it.each([
    [true, null, '', false], [true, undefined, '', false], [true, '', '', false], [true, ' ', '', false],
    [false, null, '', false], [false, undefined, '', false], [false, '', '', false], [false, ' ', '', false],
  ])('should send an email with expected personalisation data, when the request approval is %s and the reason is "%s"', async (approved, reasonText, expectedReasonText, expectedShowReasonHeader) => {
    const handler = getHandler(config);
    const data = { ...jobData, ...{ approved, reasonText } };
    await handler.processor(data);

    expect(mockSendEmail).toHaveBeenCalledTimes(1);
    expect(mockSendEmail).toHaveBeenCalledWith(
      expect.anything(),
      expect.anything(),
      expect.objectContaining({
        personalisation: expect.objectContaining({
          name: jobData.name,
          orgName: jobData.orgName,
          showReasonHeader: expectedShowReasonHeader,
          reason: expectedReasonText,
          servicesUrl: config.notifications.servicesUrl,
          helpUrl: `${config.notifications.helpUrl}/contact-us`,
        }),
      }),
    );
  });
});
