jest.mock('../../../../src/infrastructure/notify');

const { getNotifyAdapter } = require('../../../../src/infrastructure/notify');
const { getHandler } = require('../../../../src/handlers/notifications/userPermissions/changeUserPermissionLevelV1');

const config = {
  notifications: {
    helpUrl: 'https://help.dfe.signin',
    servicesUrl: 'https://services.dfe.signin',
  },
};

const jobData = {
  email: 'mock-email',
  firstName: 'mock-firstName',
  lastName: 'mock-lastName',
  orgName: 'mock-orgName',
  permission: {
    id: 1000,
    oldName: 'mock-permission-oldName',
    name: 'mock-permission-name',
  },
};

describe('When handling changeuserpermissionlevelrequest_v1 job', () => {
  const mockSendEmail = jest.fn();

  beforeEach(() => {
    mockSendEmail.mockReset();

    getNotifyAdapter.mockReset();
    getNotifyAdapter.mockReturnValue({ sendEmail: mockSendEmail });
  });

  it('should return a handler with a processor', async () => {
    const handler = getHandler(config);

    expect(handler).not.toBeNull();
    expect(handler.type).toBe('changeuserpermissionlevelrequest_v1');
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
      'userPermissionLevelChanged',
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

  it('should send email with expected personalisation data, when the user permission is increased', async () => {
    const handler = getHandler(config);

    const data = {
      ...jobData,
      ...{
        permission: {
          id: 10000,
          oldName: 'mock-permission-oldName',
          name: 'mock-permission-Name',
        },
      },
    };

    await handler.processor(data);

    expect(mockSendEmail).toHaveBeenCalledTimes(1);
    expect(mockSendEmail).toHaveBeenCalledWith(
      expect.anything(),
      expect.anything(),
      expect.objectContaining({
        personalisation: expect.objectContaining({
          firstName: data.firstName,
          lastName: data.lastName,
          orgName: data.orgName,
          oldPermissionLowercase: 'mock-permission-oldname',
          permissionLowercase: 'mock-permission-name',
          isNowApprover: true,
          isReduced: false,
          contactUsUrl: `${config.notifications.helpUrl}/contact-us`,
          permissionName: 'mock-permission-Name',
          signInUrl: config.notifications.servicesUrl,
          helpUrl: `${config.notifications.helpUrl}/contact`,
          helpApproverUrl: `${config.notifications.helpUrl}/approvers`,
        }),
      }),
    );
  });

  it('should send email with expected personalisation data, when the user permission is reduced', async () => {
    const handler = getHandler(config);

    const data = {
      ...jobData,
      ...{
        permission: {
          id: 0,
          oldName: 'mock-permission-oldName',
          name: 'mock-permission-Name',
        },
      },
    };

    await handler.processor(data);

    expect(mockSendEmail).toHaveBeenCalledTimes(1);
    expect(mockSendEmail).toHaveBeenCalledWith(
      expect.anything(),
      expect.anything(),
      expect.objectContaining({
        personalisation: expect.objectContaining({
          firstName: data.firstName,
          lastName: data.lastName,
          orgName: data.orgName,
          oldPermissionLowercase: 'mock-permission-oldname',
          permissionLowercase: 'mock-permission-name',
          isNowApprover: false,
          isReduced: true,
          contactUsUrl: `${config.notifications.helpUrl}/contact-us`,
          permissionName: 'mock-permission-Name',
          signInUrl: config.notifications.servicesUrl,
          helpUrl: `${config.notifications.helpUrl}/contact`,
          helpApproverUrl: `${config.notifications.helpUrl}/approvers`,
        }),
      }),
    );
  });
});
