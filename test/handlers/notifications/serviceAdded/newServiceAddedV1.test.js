jest.mock('../../../../src/infrastructure/email');

const config = {
  notifications: {
    type: 'disk',
    helpUrl: 'https://help.test',
  },
};

const logger = {
  info: jest.fn(),
  error: jest.fn(),
};
const data = {
  email: 'user.one@unit.test',
  firstName: 'test',
  lastName: 'testing',
  serviceName: 'Unit Test',
  orgName: 'org name'
};

describe('when processing a userserviceadded_v1 job', () => {
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

    handler = require('../../../../src/handlers/notifications/serviceAdded/newServiceAddedV1').getHandler(config, logger);
  });

  it('then it should get email adapter with config and logger', async () => {
    await handler.processor(data);

    expect(email.getEmailAdapter.mock.calls.length).toBe(1);
    expect(email.getEmailAdapter.mock.calls[0][0]).toBe(config);
    expect(email.getEmailAdapter.mock.calls[0][1]).toBe(logger);
  });

  it('then it should send an email using the user-service-added template', async () => {
    await handler.processor(data);

    expect(emailSend.mock.calls.length).toBe(1);
    expect(emailSend.mock.calls[0][1]).toBe('user-service-added');
  });

  it('then it should send an email to the user', async () => {
    await handler.processor(data);

    expect(emailSend.mock.calls[0][0]).toBe(data.email);
  });

  it('then it should include the first name in the email data', async () => {
    await handler.processor(data);

    expect(emailSend.mock.calls[0][2]).toMatchObject({
      firstName: data.firstName,
    });
  });

  it('then it should include the last name in the email data', async () => {
    await handler.processor(data);

    expect(emailSend.mock.calls[0][2]).toMatchObject({
      lastName: data.lastName,
    });
  });

  it('then it should include a link to help in the email data', async () => {
    await handler.processor(data);

    expect(emailSend.mock.calls[0][2]).toMatchObject({
      helpUrl: 'https://help.test/contact',
    });
  });

  it('then it should include a subject', async () =>{
    await handler.processor(data);

    expect(emailSend.mock.calls[0][3]).toBe('DfE Sign-in - Access to new services granted');
  });
});
