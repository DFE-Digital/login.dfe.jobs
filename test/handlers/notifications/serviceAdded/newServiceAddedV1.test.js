jest.mock('../../../../src/infrastructure/notify');
const { getNotifyAdapter } = require('../../../../src/infrastructure/notify');
const { getHandler } = require('../../../../src/handlers/notifications/serviceAdded/newServiceAddedV1');

const config = {
  notifications: {
    servicesUrl: 'https://services.dfe.signin',
    helpUrl: 'https://help.dfe.signin',
  },
};

const data = {
  email: 'mock-email',
  firstName: 'mock-firstName',
  lastName: 'mock-lastName',
};

describe('when processing a userserviceadded_v1 job', () => {
  const mockSendEmail = jest.fn();

  beforeEach(() => {
    mockSendEmail.mockReset();

    getNotifyAdapter.mockReset();
    getNotifyAdapter.mockReturnValue({ sendEmail: mockSendEmail });
  });

  it('should return a handler with a processor', async () => {
    const handler = getHandler(config);

    expect(handler).not.toBeNull();
    expect(handler.type).toBe('userserviceadded_v1');
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
      'userRequestForServiceApprovedV1',
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

  it('should send email with expected personalisation data', async () => {
    const handler = getHandler(config);

    await handler.processor(data);

    expect(mockSendEmail).toHaveBeenCalledTimes(1);
    expect(mockSendEmail).toHaveBeenCalledWith(
      expect.anything(),
      expect.anything(),
      expect.objectContaining({
        personalisation: expect.objectContaining({
          firstName: data.firstName,
          lastName: data.lastName,
          signInUrl: config.notifications.servicesUrl,
          helpUrl: `${config.notifications.helpUrl}/contact-us`,
        }),
      }),
    );
  });
});
