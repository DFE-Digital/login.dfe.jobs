jest.mock('../../../../src/infrastructure/notify');

const { getNotifyAdapter } = require('../../../../src/infrastructure/notify');
const { getHandler } = require('../../../../src/handlers/notifications/invite/newUserInvitationV2');

const config = {
  notifications: {
    profileUrl: 'https://profile.test/reg',
    helpUrl: 'https://help.test',
  },
};
const commonJobData = {
  firstName: 'User',
  lastName: 'One',
  email: 'user.one@unit.tests',
  invitationId: '59205751-c229-4924-8acb-61a7d5edfa33',
};

describe('when sending v2 user invitation', () => {
  const mockSendEmail = jest.fn();

  beforeEach(() => {
    mockSendEmail.mockReset();

    getNotifyAdapter.mockReset();
    getNotifyAdapter.mockReturnValue({ sendEmail: mockSendEmail });
  });

  it('should return a handler with a processor', () => {
    const handler = getHandler(config);

    expect(handler).not.toBeNull();
    expect(handler.type).toBe('invitation_v2');
    expect(handler.processor).not.toBeNull();
    expect(handler.processor).toBeInstanceOf(Function);
  });

  it('should get email adapter with supplied config', async () => {
    const handler = getHandler(config);

    await handler.processor(commonJobData);

    expect(getNotifyAdapter).toHaveBeenCalledTimes(1);
    expect(getNotifyAdapter).toHaveBeenCalledWith(config);
  });
});
