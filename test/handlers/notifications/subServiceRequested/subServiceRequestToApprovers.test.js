jest.mock('../../../../src/infrastructure/organisations');
jest.mock('../../../../src/infrastructure/directories');
jest.mock('../../../../src/infrastructure/email');
jest.mock('../../../../src/handlers/notifications/utils');
jest.mock('login.dfe.dao', () => ({
  directories: {
    getAllActiveUsersFromList() {
      return [1];
    },
  },
}));

const OrganisationsClient = require('../../../../src/infrastructure/organisations');
const DirectoriesClient = require('../../../../src/infrastructure/directories');

const {
  getDefaultConfig,
  getLoggerMock,
  getOrganisationsClientMock,
  getDirectoriesClientMock,
} = require('../../../utils');

const config = getDefaultConfig();
const logger = getLoggerMock();

const organisatonsClient = getOrganisationsClientMock();
const directoriesClient = getDirectoriesClientMock();

let data = {
  senderFirstName: 'Jane',
  senderLastName: 'Doe',
  senderEmail: 'jane.doe@unit.test',
  orgId: 'OrgansiationID-123456',
  orgName: 'Test Organisation',
  serviceName: 'Test ServiceName',
  requestedSubServices: ['test-sub-service'],
  rejectUrl: 'https://rejectUrl',
  approveUrl: 'https://approveUrl',
  helpUrl: 'https://help.com',
};

describe('when processing a sub_service_request_to_approvers job', () => {
  let emailSend;
  let email;
  let handler;

  beforeEach(() => {
    emailSend = jest.fn();
    email = require('../../../../src/infrastructure/email');
    email.getEmailAdapter = jest.fn().mockImplementation(() => ({
      send: emailSend,
    }));

    organisatonsClient.mockResetAll();
    organisatonsClient.getApproversForOrganisation.mockReturnValue(['appover1']);
    OrganisationsClient.mockImplementation(() => organisatonsClient);

    directoriesClient.mockResetAll();
    directoriesClient.getUsersByIds.mockReturnValue([
      {
        id: 'approver1',
        email: 'approver@email.com',
        given_name: 'Test',
        family_name: 'User',
      },
    ]);
    DirectoriesClient.mockImplementation(() => directoriesClient);
    handler = require('../../../../src/handlers/notifications/subServiceRequested/subServiceRequestToApprovers').getHandler(
      config,
      logger,
    );
  });

  it('then it should get email adapter with config and logger', async () => {
    await handler.processor(data);

    expect(organisatonsClient.getApproversForOrganisation).toHaveBeenCalledTimes(1);
    expect(organisatonsClient.getApproversForOrganisation.mock.calls[0][0]).toBe(data.orgId);
    expect(directoriesClient.getUsersByIds).toHaveBeenCalledTimes(1);

    expect(email.getEmailAdapter.mock.calls.length).toBe(1);
    expect(email.getEmailAdapter.mock.calls[0][0]).toBe(config);
    expect(email.getEmailAdapter.mock.calls[0][1]).toBe(logger);
  });

  it('then it should send an email using the sub-service-request-to-approvers template', async () => {
    await handler.processor(data);

    expect(emailSend.mock.calls.length).toBe(1);
    expect(emailSend.mock.calls[0][1]).toBe('sub-service-request-to-approvers');
  });

  it('then it should send an email including the rquest data', async () => {
    await handler.processor(data);

    expect(emailSend.mock.calls.length).toBe(1);
    expect(emailSend.mock.calls[0][2]).toMatchObject({
      approverName: 'Test User',
      senderName: 'Jane Doe',
      senderEmail: 'jane.doe@unit.test',
      orgName: 'Test Organisation',
      approveUrl: 'https://approveUrl',
      rejectUrl: 'https://rejectUrl',
      helpUrl: 'https://help.com',
      serviceName: 'Test ServiceName',
      requestedSubServices: ['test-sub-service'],
    });
  });

  it('then it should send an email to the approver', async () => {
    await handler.processor(data);

    expect(emailSend.mock.calls[0][0]).toBe('approver@email.com');
  });

  it('then it should include a subject prefixed by the env name if env not PROD', async () => {
    await handler.processor(data);

    expect(emailSend.mock.calls[0][3]).toBe('(unitTestEnv) Request to change sub-service access.');
  });

  it('then it should include a subject without a prefix if env is PROD', async () => {
    config.notifications.envName = 'pr';
    await handler.processor(data);

    expect(emailSend.mock.calls[0][3]).toBe('Request to change sub-service access.');
  });
  it('then it shoud log the error message and throw an error if there is an Error', async () => {
    data = undefined;
    try {
      await handler.processor(data);
    } catch (e) {
      expect(logger.error.mock.calls[0][0]).toBe(
        `Failed to process and send the email for type sub_service_request_to_approvers - ${JSON.stringify(e)}`,
      );
      expect(e.message).toBe(
        `Failed to process and send the email for type sub_service_request_to_approvers - ${JSON.stringify(e)}`,
      );
    }
  });
});
