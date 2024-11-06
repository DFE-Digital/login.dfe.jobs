jest.mock('../../../../src/infrastructure/email');

const email = require('../../../../src/infrastructure/email');
const registrationCompleteV1 = require('../../../../src/handlers/notifications/registration/registrationCompleteV1');

const emailSend = jest.fn();
const config = {
  notifications: {
    type: 'disk',
    profileUrl: 'http://unit.test/profile/',
  },
};
const logger = {
  info: jest.fn(),
  error: jest.fn(),
};
const data = {
  email: 'user.one@unit.test',
  firstName: 'User',
  lastName: 'One',
  serviceWelcomeMessage: 'welcome user one',
  serviceWelcomeMessageDescription: 'this is a unit test',
  serviceName: 'unit tests',
  invitationId: 'test-invite-id',
  code: 'ABC123',
};
const handler = registrationCompleteV1.getHandler(config, logger);

describe('when processing a registrationcomplete_v1 job', () => {
  beforeEach(() => {
    emailSend.mockReset();
    email.getEmailAdapter.mockReset().mockImplementation(() => {
      return {
        send: emailSend,
      };
    });


  });

  it('then it should get email adapter with config and logger', async () => {
    await handler.processor(data);

    expect(email.getEmailAdapter.mock.calls.length).toBe(1);
    expect(email.getEmailAdapter.mock.calls[0][0]).toBe(config);
    expect(email.getEmailAdapter.mock.calls[0][1]).toBe(logger);
  });

  it('then it should send an email using the registrationcomplete template', async () => {
    await handler.processor(data);

    expect(emailSend.mock.calls.length).toBe(1);
    expect(emailSend.mock.calls[0][1]).toBe('registrationcomplete');
  });

  it('then it should send an email to the user', async () => {
    await handler.processor(data);

    expect(emailSend.mock.calls[0][0]).toBe(data.email);
  });

  it('then it should include the users name in the email data', async () => {
    await handler.processor(data);

    expect(emailSend.mock.calls[0][2]).toMatchObject({
      firstName: data.firstName,
      lastName: data.lastName,
    });
  });

  it('then it should include the users email address in the email data', async () => {
    await handler.processor(data);

    expect(emailSend.mock.calls[0][2]).toMatchObject({
      email: data.email,
    });
  });

  it('then it should include a link to profile in the email data', async () => {
    await handler.processor(data);

    expect(emailSend.mock.calls[0][2]).toMatchObject({
      profileUrl: config.notifications.profileUrl,
    });
  });

  it('then it should include a subject', async () => {
    await handler.processor(data);

    expect(emailSend.mock.calls[0][3]).toBe('Your new DfE Sign-in account is ready');
  });
});
