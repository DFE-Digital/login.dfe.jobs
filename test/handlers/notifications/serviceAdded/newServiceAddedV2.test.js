jest.mock('../../../../src/infrastructure/email');

const config = {
  notifications: {
    type: 'disk',
    servicesUrl: 'https://sign-in.test',
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
  orgName: 'org name',
  permission: {
    id: 0,
    name: 'End user',
  },
  serviceName: 'Unit Test',
  requestedSubServices: ['role1'],
  signInUrl: 'https://sign-in.test/my-services',
  helpUrl: 'https://help.test/contact',
  helpApproverUrl: 'https://help.test/approvers',
};

describe('when processing a userserviceadded_v2 job', () => {
  let emailSend;
  let email;
  let handler;

  beforeEach(() => {
    emailSend = jest.fn();
    email = require('../../../../src/infrastructure/email');
    email.getEmailAdapter = jest.fn().mockImplementation(() => ({
      send: emailSend,
    }));

    handler = require('../../../../src/handlers/notifications/serviceAdded/newServiceAddedV2').getHandler(config, logger);
  });

  it('then it should get email adapter with config and logger', async () => {
    await handler.processor(data);

    expect(email.getEmailAdapter.mock.calls.length).toBe(1);
    expect(email.getEmailAdapter.mock.calls[0][0]).toBe(config);
    expect(email.getEmailAdapter.mock.calls[0][1]).toBe(logger);
  });

  it('then it should send an email using the user-service-added-v2 template', async () => {
    await handler.processor(data);

    expect(emailSend.mock.calls.length).toBe(1);
    expect(emailSend.mock.calls[0][1]).toBe('user-service-added-v2');
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

  it('then it should include the organisation name in the email data', async () => {
    await handler.processor(data);

    expect(emailSend.mock.calls[0][2]).toMatchObject({
      orgName: data.orgName,
    });
  });

  it('then it should include the permission level in the email data', async () => {
    await handler.processor(data);

    expect(emailSend.mock.calls[0][2]).toMatchObject({
      permission: data.permission,
    });
  });

  it('then it should include the requested sub services in the email data', async () => {
    await handler.processor(data);

    expect(emailSend.mock.calls[0][2]).toMatchObject({
      requestedSubServices: data.requestedSubServices,
    });
  });

  it('then it should include the sign in URL in the email data', async () => {
    await handler.processor(data);

    expect(emailSend.mock.calls[0][2]).toMatchObject({
      signInUrl: data.signInUrl,
    });
  });

  it('then it should include the help URL in the email data', async () => {
    await handler.processor(data);

    expect(emailSend.mock.calls[0][2]).toMatchObject({
      helpUrl: data.helpUrl,
    });
  });

  it('then it should include the help URL for approvers in the email data', async () => {
    await handler.processor(data);

    expect(emailSend.mock.calls[0][2]).toMatchObject({
      helpApproverUrl: data.helpApproverUrl,
    });
  });

  it('then it should include a subject', async () =>{
    await handler.processor(data);

    expect(emailSend.mock.calls[0][3]).toBe('New service added to your DfE Sign-in account');
  });
});
