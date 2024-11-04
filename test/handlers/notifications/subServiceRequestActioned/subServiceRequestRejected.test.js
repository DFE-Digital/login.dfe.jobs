const config = {
  notifications: {
    type: 'disk',
    helpUrl: 'https://help.test',
    servicesUrl: 'https://services',
  },
};

const logger = {
  info: jest.fn(),
  error: jest.fn(),
};
let data = {
  email: 'john.doe@unit.test',
  firstName: 'John',
  lastName: 'Doe',
  orgName: 'Organisation name',
  serviceName: 'Service name',
  requestedSubServices: ['Sub-service1'],
  reason: 'Rejection reason message',
  signInUrl: `${config.notifications.servicesUrl}/my-services`,
};

describe('When processing a sub_service_request_rejected job', () => {
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

    handler = require('../../../../src/handlers/notifications/subServiceRequestActioned/subServiceRequestRejected').getHandler(
      config,
      logger,
    );
  });

  it('then it should get email adapter with config and logger', async () => {
    await handler.processor(data);

    expect(email.getEmailAdapter.mock.calls.length).toBe(1);
    expect(email.getEmailAdapter.mock.calls[0][0]).toBe(config);
    expect(email.getEmailAdapter.mock.calls[0][1]).toBe(logger);
  });

  it('then it should send an email using the sub-service-request-rejected template', async () => {
    await handler.processor(data);

    expect(emailSend.mock.calls.length).toBe(1);
    expect(emailSend.mock.calls[0][1]).toBe('sub-service-request-rejected');
  });

  it('then it should send an email to the End user', async () => {
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

  it('then it should include the requested sub services list in the email data', async () => {
    await handler.processor(data);

    expect(emailSend.mock.calls[0][2]).toMatchObject({
      requestedSubServices: data.requestedSubServices,
    });
  });

  it('then it should include a link to Dfe Sign-in in the email data', async () => {
    await handler.processor(data);

    expect(emailSend.mock.calls[0][2]).toMatchObject({
      signInUrl: data.signInUrl,
    });
  });

  it('then it should include a rejection reason the email data', async () => {
    await handler.processor(data);

    expect(emailSend.mock.calls[0][2]).toMatchObject({
      reason: data.reason,
    });
  });

  it('then it should include a subject', async () => {
    await handler.processor(data);

    expect(emailSend.mock.calls[0][3]).toBe('Sub-service request rejected');
  });

  it('then it shoud log the error message and throw an error if there is an Error', async () => {
    data = undefined;
    try {
      await handler.processor(data);
    } catch (e) {
      expect(logger.error.mock.calls[0][0]).toBe(
        `Failed to process and send the email for job type sub_service_request_rejected  - ${JSON.stringify(e)}`,
      );
      expect(e.message).toBe(
        `Failed to process and send the email for job type sub_service_request_rejected - ${JSON.stringify(e)}`,
      );
    }
  });
});
