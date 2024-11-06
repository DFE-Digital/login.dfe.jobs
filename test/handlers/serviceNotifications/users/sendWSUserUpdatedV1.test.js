jest.mock('../../../../src/infrastructure/repository');
jest.mock('../../../../src/infrastructure/webServices/SecureAccessWebServiceClient');

const { getRepository } = require('../../../../src/infrastructure/repository');
const SecureAccessWebServiceClient = require('../../../../src/infrastructure/webServices/SecureAccessWebServiceClient');
const { getDefaultConfig, getLoggerMock, getRepositoryMock } = require('../testUtils');
const { v4:uuid } = require('uuid');
const { getHandler } = require('../../../../src/handlers/serviceNotifications/users/sendWSUserUpdatedV1');

const config = getDefaultConfig();
const logger = getLoggerMock();
const data = {
  user: {
    userId: 'user1',
    legacyUserId: 987654,
    legacyUsername: 987654,
    firstName: 'User',
    lastName: 'One',
    email: 'user.one@unit.tests',
    status: 1,
    organisationId: 123,
    organisationUrn: '987654',
    organisationLACode: '999',
    roles: [
      {
        id: 'role1',
        code: 'ROLE-ONE',
      },
    ],
  },
  applicationId: 'service1',
};
const jobId = 1;
const application = {
  id: data.applicationId,
  relyingParty: {
    params: {
      receiveUserUpdates: 'true',
      wsWsdlUrl: 'https://service.one.test/ws/wsdl',
      wsUsername: 'userone',
      wsPassword: 'the-password',
    },
  },
};
const repository = getRepositoryMock();
const secureAccessWebServiceClient = {
  provisionUser: jest.fn(),
};


describe('when handling sendwsuserupdated_v1 job', () => {
  beforeEach(() => {
    data.applicationId = uuid();
    application.id = data.applicationId;

    getRepository.mockReset().mockReturnValue(repository);
    repository.mockResetAll();
    repository.userState.findOne.mockReturnValue({
      user_id: data.user.userId,
      legacy_user_id: data.user.legacyUserId,
      email: data.user.email,
      status_id: data.user.status,
      organisation_id: data.user.organisationId,
      organisation_urn: data.user.organisationUrn,
      organisation_la_code: data.user.organisationLACode,
    });
    repository.userRoleState.findAll.mockReturnValue([
      {
        role_id: data.user.roles[0].id,
        role_code: data.user.roles[0].code,
      },
    ]);

    SecureAccessWebServiceClient.create.mockReset().mockImplementation(() => secureAccessWebServiceClient);
    secureAccessWebServiceClient.provisionUser.mockReset();
  });

  it('then it should register handler with application specific type', () => {
    const handler = getHandler(config, logger, application);

    expect(handler.type).toBe(`sendwsuserupdated_v1_${application.id}`);
  });

  it('then it should get previous state for application and user', async () => {
    const handler = getHandler(config, logger, application);
    await handler.processor(data, jobId);

    expect(repository.userState.findOne).toHaveBeenCalledTimes(1);
    expect(repository.userState.findOne).toHaveBeenCalledWith({
      where: {
        service_id: data.applicationId,
        user_id: data.user.userId,
        organisation_id: data.user.organisationId,
      },
    });
  });

  it('then it should send create message to application if no previous state stored', async () => {
    repository.userState.findOne.mockReturnValue(undefined);

    const handler = getHandler(config, logger, application);
    await handler.processor(data, jobId);

    expect(SecureAccessWebServiceClient.create).toHaveBeenCalledTimes(1);
    expect(SecureAccessWebServiceClient.create).toHaveBeenCalledWith('https://service.one.test/ws/wsdl', 'userone', 'the-password', false, 'senduserupdated-1');
    expect(secureAccessWebServiceClient.provisionUser).toHaveBeenCalledTimes(1);
    expect(secureAccessWebServiceClient.provisionUser).toHaveBeenCalledWith('CREATE', data.user.legacyUserId, data.user.legacyUsername, data.user.firstName, data.user.lastName,
      data.user.email, data.user.organisationId, 1, data.user.organisationUrn, data.user.organisationLACode, data.user.roles, data.user.organisationUid);
  });

  it('then it should send update message to application if previous state stored', async () => {
    repository.userState.findOne.mockReturnValue({ last_action_sent: 'UPDATE' });

    const handler = getHandler(config, logger, application);
    await handler.processor(data, jobId);

    expect(SecureAccessWebServiceClient.create).toHaveBeenCalledTimes(1);
    expect(SecureAccessWebServiceClient.create).toHaveBeenCalledWith('https://service.one.test/ws/wsdl', 'userone', 'the-password', false, 'senduserupdated-1');
    expect(secureAccessWebServiceClient.provisionUser).toHaveBeenCalledTimes(1);
    expect(secureAccessWebServiceClient.provisionUser).toHaveBeenCalledWith('UPDATE', data.user.legacyUserId, data.user.legacyUsername, data.user.firstName, data.user.lastName,
      data.user.email, data.user.organisationId, 1, data.user.organisationUrn, data.user.organisationLACode, data.user.roles, data.user.organisationUid);
  });

  it('then it should store the new user state', async () => {
    const handler = getHandler(config, logger, application);
    await handler.processor(data, jobId);

    expect(repository.userState.upsert).toHaveBeenCalledTimes(1);
    expect(repository.userState.upsert).toHaveBeenCalledWith({
      service_id: data.applicationId,
      user_id: data.user.userId,
      organisation_id: data.user.organisationId,
      last_action_sent: 'CREATE',
    });
  });
});
