jest.mock('../../../../src/infrastructure/email');

const { getEmailAdapter } = require('../../../../src/infrastructure/email');
const { getHandler } = require('../../../../src/handlers/notifications/accessRequest/userAccessRequestV1');
const emailSend = jest.fn();

const config = {
  notifications: {
    helpUrl: 'https://help.test',
  },
};
const logger = {};
const jobData = {
  orgName: 'Test Organisation',
  name: 'Test One',
  email: 'test.one@email.com',
};

describe('When handling useraccessRequest_v1 job', () => {
  beforeEach(() => {
    emailSend.mockReset();
    getEmailAdapter.mockReset();
    getEmailAdapter.mockReturnValue({ send: emailSend });
  });

  it('then it should return a handler with a processor', () => {
    const handler = getHandler(config, logger);
    expect(handler).not.toBeNull();
    expect(handler.type).toBe('useraccessrequest_v1');
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

  it('then it should send email to users email address', async () => {
    const handler = getHandler(config, logger);
    await handler.processor(jobData);
    expect(emailSend.mock.calls).toHaveLength(1);
    expect(emailSend.mock.calls[0][0]).toBe(jobData.email);
  });

  it('then it should send email using user-access-request-email template', async () => {
    const handler = getHandler(config, logger);
    await handler.processor(jobData);
    expect(emailSend.mock.calls).toHaveLength(1);
    expect(emailSend.mock.calls[0][1]).toBe('user-access-request-email');
  });

  it('then it should send email using request data as model', async () => {
    const handler = getHandler(config, logger);
    await handler.processor(jobData);
    expect(emailSend.mock.calls).toHaveLength(1);
    expect(emailSend.mock.calls[0][2]).toEqual({
      name: jobData.name,
      orgName: jobData.orgName,
      helpUrl: 'https://help.test/contact'
    });
  });

  it('then it should send email with subject', async () => {
    const handler = getHandler(config, logger);
    await handler.processor(jobData);
    expect(emailSend.mock.calls).toHaveLength(1);
    expect(emailSend.mock.calls[0][3]).toBe(`DfE Sign-in - Request to access ${jobData.orgName}`);
  });
});
