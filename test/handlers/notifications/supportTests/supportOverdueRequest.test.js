jest.mock('../../../../src/infrastructure/email');

const { getEmailAdapter } = require('../../../../src/infrastructure/email');
const { getHandler } = require('../../../../src/handlers/notifications/support/supportOverdueRequest');
const emailSend = jest.fn();

const config = {
  notifications: {
    helpUrl: 'https://help.test',
    servicesUrl: 'https://services.test',
  },
};

const logger = {};
const jobData = {
  name: 'User One',
  requestsCount: 8,
};

describe('When handling supportoverduerequest job', () => {
  beforeEach(() => {
    emailSend.mockReset();
    getEmailAdapter.mockReset();
    getEmailAdapter.mockReturnValue({ send: emailSend });
  });

  it('then it should return a handler with a processor', () => {
    const handler = getHandler(config, logger);

    expect(handler).not.toBeNull();
    expect(handler.type).toBe('supportoverduerequest');
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

  it('then it should send email using support-overdue-request template', async () => {
    const handler = getHandler(config, logger);

    await handler.processor(jobData);

    expect(emailSend.mock.calls).toHaveLength(1);
    expect(emailSend.mock.calls[0][1]).toBe('support-overdue-request');
  });

  it('then it should send email using request data as model', async () => {
    const handler = getHandler(config, logger);

    await handler.processor(jobData);

    expect(emailSend.mock.calls).toHaveLength(1);
    expect(emailSend.mock.calls[0][2]).toEqual({
      name: jobData.name,
      requestsCount: jobData.requestsCount,
      helpUrl: 'https://help.test/contact',
      servicesUrl: 'https://services.test/access-requests',
    });
  });

  it('then it should send email with subject for multiple requests', async () => {
    const handler = getHandler(config, logger);

    await handler.processor(jobData);

    expect(emailSend.mock.calls).toHaveLength(1);
    expect(emailSend.mock.calls[0][3]).toBe(`Action needed: ${jobData.requestsCount} outstanding requests awaiting approval on DfE Sign-in`);
  });

  it('then it should send email with subject for a single request', async () => {
    const handler = getHandler(config, logger);
    jobData.requestsCount = 1
    await handler.processor(jobData);

    expect(emailSend.mock.calls).toHaveLength(1);
    expect(emailSend.mock.calls[0][3]).toBe(`Action needed: ${jobData.requestsCount} outstanding request awaiting approval on DfE Sign-in`);
  });
});
