jest.mock('../../../../src/infrastructure/organisations');
jest.mock('../../../../src/infrastructure/directories');
jest.mock('../../../../src/infrastructure/email');
jest.mock('../../../../src/handlers/notifications/utils');

jest.mock('login.dfe.dao',()=>({
  directories:{
    getAllActiveUsersFromList(){
      return [1]
    }
  }
}));



const OrganisationsClient = require('../../../../src/infrastructure/organisations');
const DirectoriesClient = require('../../../../src/infrastructure/directories');

const { getDefaultConfig, getLoggerMock, getOrganisationsClientMock, getDirectoriesClientMock } = require('../../../utils');

const config = getDefaultConfig();
const logger = getLoggerMock();

const organisatonsClient = getOrganisationsClientMock();
const directoriesClient = getDirectoriesClientMock();

const data = {
  senderName: "TestUser",
  senderEmail: "testuser1@test.com",
  orgId: "ABCDEFGH-XXXX-1234-BFCC-7D9CB120577A",
  orgName: "DSI TEST",
  requestedServiceName: "Subservice Test",
  requestedSubServices: ["RAISE Training Anon"],
  rejectServiceUrl: "https://dfe-test.com/reject",
  approveServiceUrl: "https://dfe-test.com/approve"
};

describe('when processing a servicerequest_to_approvers_v2 job', () => {
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

    organisatonsClient.mockResetAll();
    organisatonsClient.getOrgRequestById.mockReturnValue(
      {
        id: 'requestId',
        user_id: 'user1',
        org_id: 'org1',
        reason: 'I need access pls'
      },
    );
    organisatonsClient.getApproversForOrganisation.mockReturnValue(['appover1']);
    OrganisationsClient.mockImplementation(() => organisatonsClient);

    directoriesClient.mockResetAll();
    directoriesClient.getUsersByIds.mockReturnValue([{
      id: 'approver1',
      email: 'approver@email.com',
      given_name: 'Test',
      family_name: 'User'
    }]);
    DirectoriesClient.mockImplementation(() => directoriesClient);
    handler = require('../../../../src/handlers/notifications/serviceRequested/serviceRequestToApproversV2').getHandler(config, logger);
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

  it('then it should send an email using the service-request-to-approvers template', async () => {
    await handler.processor(data);

    expect(emailSend.mock.calls.length).toBe(1);
    expect(emailSend.mock.calls[0][1]).toBe('service-request-to-approvers');
  });

  it('then it should send an email to the approver', async () => {
    await handler.processor(data);

    expect(emailSend.mock.calls[0][0]).toBe("approver@email.com");
  });

  it('then it should include a subject', async () =>{
    await handler.processor(data);
    expect(emailSend.mock.calls[0][3]).toBe('(unitTestEnv) A user has requested access to a service');
  });
});

