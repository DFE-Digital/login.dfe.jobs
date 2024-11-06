jest.mock('../../../../src/infrastructure/email');

const { getEmailAdapter } = require('../../../../src/infrastructure/email');
const { getHandler } = require('../../../../src/handlers/notifications/support/supportRequestConfirmationV1');
const emailSend = jest.fn();

const config = {
  notifications: {
    type: 'disk',
    saUrl: 'unit.test.com',
    servicesUrl: 'unit.services.com'
  },
};

const logger = {};
const jobData = {
  name: 'User One',
  email: 'user.one@unit.tests',
  reference: 'SIN123456798',
  service: 'Service Name',
};

describe('When handling supportrequestconfirmation_v1 job', () => {
  beforeEach(() => {
    emailSend.mockReset();

    getEmailAdapter.mockReset();
    getEmailAdapter.mockReturnValue({ send: emailSend });
  });

  it('then it should return a handler with a processor', () => {
    const handler = getHandler(config, logger);

    expect(handler).not.toBeNull();
    expect(handler.type).toBe('supportrequestconfirmation_v1');
    expect(handler.processor).not.toBeNull();
    expect(handler.processor).toBeInstanceOf(Function);
  });

  it('then it should get email adapter with supplied config and logger', async () => {
    const handler = getHandler(config, logger);

    await handler.processor(jobData);

    expect(getEmailAdapter.mock.calls).toHaveLength(1);
    expect(getEmailAdapter.mock.calls[0][0]).toBe(config);
    expect(getEmailAdapter.mock.calls[0][1]).toBe(logger);
  });

  it('then it should send email to user', async () => {
    const handler = getHandler(config, logger);

    await handler.processor(jobData);

    expect(emailSend.mock.calls).toHaveLength(1);
    expect(emailSend.mock.calls[0][0]).toBe(jobData.email);
  });

  it('then it should send email using support-request-confirmation template', async () => {
    const handler = getHandler(config, logger);

    await handler.processor(jobData);

    expect(emailSend.mock.calls).toHaveLength(1);
    expect(emailSend.mock.calls[0][1]).toBe('support-request-confirmation');
  });

  it('then it should send email using request data as model', async () => {
    const handler = getHandler(config, logger);

    await handler.processor(jobData);

    expect(emailSend.mock.calls).toHaveLength(1);
    expect(emailSend.mock.calls[0][2]).toEqual({
      name: jobData.name,
      service: jobData.service,
      saUrl: 'unit.test.com/existing-secure-access-user',
      servicesUrl: 'unit.services.com'
    });
  });

  it('then it should send email with subject', async () => {
    const handler = getHandler(config, logger);

    await handler.processor(jobData);

    expect(emailSend.mock.calls).toHaveLength(1);
    expect(emailSend.mock.calls[0][3]).toBe('Your DfE Sign-in service desk request was received. Reference: ' + jobData.reference);
  });
});
