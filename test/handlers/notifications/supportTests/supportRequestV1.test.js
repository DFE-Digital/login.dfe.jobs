jest.mock('../../../../src/infrastructure/notify');
const { getNotifyAdapter } = require('../../../../src/infrastructure/notify');
const { getHandler } = require('../../../../src/handlers/notifications/support/supportRequestV1');

const config = {
  notifications: {
    helpUrl: 'https://help.dfe.signin',
    supportEmailAddress: 'mock-support-email-address',
  },
};

const jobData = {
  name: 'mock-name',
  email: 'mock-email',
  orgName: 'mock-org',
  urn: 'mock-urn',
  service: 'mock-service',
  type: 'mock-type',
  message: 'mock-message',
  typeAdditionalInfo: 'mock-type-additional-info',
};

describe('When handling supportrequest_v1 job', () => {
  const mockSendEmail = jest.fn();

  beforeEach(() => {
    mockSendEmail.mockReset();

    getNotifyAdapter.mockReset();
    getNotifyAdapter.mockReturnValue({ sendEmail: mockSendEmail });
  });

  it('should return a handler with a processor', async () => {
    const handler = getHandler(config);

    expect(handler).not.toBeNull();
    expect(handler.type).toBe('supportrequest_v1');
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
      'supportRequest',
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
      config.notifications.supportEmailAddress,
      expect.anything(),
    );
  });

  it.each([
    ['', '', false], [null, '', false], ['   ', '', false], [undefined, '', false], ['mock-some-additional-info', 'mock-some-additional-info', true],
  ])('should send an email with expected personalisation data, with the typeAdditionalInfo set as %s, the expected typeAdditionalInfo should be %s and the header should be visible %s', async (typeAdditionalInfo, expectedTypeAdditionalInfo, expectedShowAdditionalInfoHeader) => {
    const handler = getHandler(config);
    const data = { ...jobData, ...{ typeAdditionalInfo } };
    await handler.processor(data);

    expect(mockSendEmail).toHaveBeenCalledTimes(1);
    expect(mockSendEmail).toHaveBeenCalledWith(
      expect.anything(),
      expect.anything(),
      expect.objectContaining({
        personalisation: expect.objectContaining({
          name: data.name,
          email: data.email,
          orgName: data.orgName,
          urn: data.urn,
          service: data.service,
          type: data.type,
          message: data.message,
          showAdditionalInfoHeader: expectedShowAdditionalInfoHeader,
          typeAdditionalInfo: expectedTypeAdditionalInfo,
          helpUrl: `${config.notifications.helpUrl}/contact-us`,
        }),
      }),
    );
  });

  it.each([
    ['', ''], [null, ''], [undefined, ''], ['mock-some-urn', 'mock-some-urn'],
  ])('should send an email with expected personalisation data, with the urn set as %s, the expected urn should be %s', async (urn, expectedUrn) => {
    const handler = getHandler(config);
    const data = { ...jobData, ...{ urn } };
    await handler.processor(data);

    expect(mockSendEmail).toHaveBeenCalledTimes(1);
    expect(mockSendEmail).toHaveBeenCalledWith(
      expect.anything(),
      expect.anything(),
      expect.objectContaining({
        personalisation: expect.objectContaining({
          name: data.name,
          email: data.email,
          orgName: data.orgName,
          urn: expectedUrn,
          service: data.service,
          type: data.type,
          message: data.message,
          showAdditionalInfoHeader: true,
          typeAdditionalInfo: data.typeAdditionalInfo,
          helpUrl: `${config.notifications.helpUrl}/contact-us`,
        }),
      }),
    );
  });

  it.each([
    ['', ''], [null, ''], [undefined, ''], ['mock-a-orgName', 'mock-a-orgName'],
  ])('should send an email with expected personalisation data, with the orgName set as %s, the expected orgName should be %s', async (orgName, expectedOrgName) => {
    const handler = getHandler(config);
    const data = { ...jobData, ...{ orgName } };
    await handler.processor(data);

    expect(mockSendEmail).toHaveBeenCalledTimes(1);
    expect(mockSendEmail).toHaveBeenCalledWith(
      expect.anything(),
      expect.anything(),
      expect.objectContaining({
        personalisation: expect.objectContaining({
          name: data.name,
          email: data.email,
          orgName: expectedOrgName,
          urn: data.urn,
          service: data.service,
          type: data.type,
          message: data.message,
          showAdditionalInfoHeader: true,
          typeAdditionalInfo: data.typeAdditionalInfo,
          helpUrl: `${config.notifications.helpUrl}/contact-us`,
        }),
      }),
    );
  });
});
