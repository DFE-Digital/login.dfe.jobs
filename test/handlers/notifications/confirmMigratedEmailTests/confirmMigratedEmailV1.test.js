jest.mock('../../../../src/infrastructure/email');
jest.mock('uuid', () => {
  return {
    v4: jest.fn().mockReturnValue('some-uuid')
  }
});

const config = {
  notifications: {
    type: 'disk',
    migrationUrl: 'http://unit.test/migration/',
  },
};
const logger = {
  info: jest.fn(),
  error: jest.fn(),
};
const data = {
  email: 'user.one@unit.test',
  code: 'TEST01',
  clientId: 'CLIENT1',
  uid: '65432RFV',
};

describe('when processing a confirmMigratedEmail_v1 job', () => {
  let emailSend;
  let email;
  let handler;

  beforeEach(() => {
    emailSend = jest.fn();
    email = require('../../../../src/infrastructure/email');
    email.getEmailAdapter = jest.fn().mockImplementation(() => {
      return {
        send: emailSend,
      };
    });
    handler = require('../../../../src/handlers/notifications/confirmMigratedEmail/confirmMigratedEmailV1').getHandler(config, logger);
  });

  it('then it should get email adapter with config and logger', async () => {
    await handler.processor(data);

    expect(email.getEmailAdapter.mock.calls.length).toBe(1);
    expect(email.getEmailAdapter.mock.calls[0][0]).toBe(config);
    expect(email.getEmailAdapter.mock.calls[0][1]).toBe(logger);
  });

  it('then it should send an email using the confirm-migrated-email template', async () => {
    await handler.processor(data);

    expect(emailSend.mock.calls.length).toBe(1);
    expect(emailSend.mock.calls[0][1]).toBe('confirm-migrated-email');
  });

  it('then it should send an email to the user', async () => {
    await handler.processor(data);

    expect(emailSend.mock.calls[0][0]).toBe(data.email);
  });

  it('then it should include the reset code in the email data', async () => {
    await handler.processor(data);

    expect(emailSend.mock.calls[0][2]).toMatchObject({
      code: data.code,
    });
  });

  it('then it should include the client id in the email data', async () => {
    await handler.processor(data);

    expect(emailSend.mock.calls[0][2]).toMatchObject({
      clientId: data.clientId,
    });
  });

  it('then it should include a link to interactions in the email data', async () => {
    await handler.processor(data);

    expect(emailSend.mock.calls[0][2]).toMatchObject({
      returnUrl: `${config.notifications.interactionsUrl}/some-uuid/migration/${data.uid}/confirm-email`,
    });
  });

  it('then it should include a subject', async () =>{
    await handler.processor(data);

    expect(emailSend.mock.calls[0][3]).toBe('DfE Sign-in: confirm your email');
  });
});
