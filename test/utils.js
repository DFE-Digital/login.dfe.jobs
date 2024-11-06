const getDefaultConfig = () => {
  return {
    queueStorage: {
      connectionString: 'redis://test:6379',
    },
    loggerSettings: {
      logLevel: 'info',
      coors: {
        info: 'red',
        ok: 'green',
        error: 'yellow',
      },
    },
    notifications: {
      email: {
        type: 'disk'
      },
      envName:'unitTestEnv'
    },
  };
};

const getOrganisationsClientMock = () => {
  return {
    getOrgRequestById: jest.fn(),
    getApproversForOrganisation: jest.fn(),
    getOrganisationById: jest.fn(),
    mockResetAll: function () {
      this.getOrgRequestById.mockReset();
      this.getApproversForOrganisation.mockReset();
      this.getOrganisationById.mockReset();
    },
  };
};

const getLoggerMock = () => {
  return {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    mockResetAll: function() {
      this.info.mockReset();
      this.warn.mockReset();
      this.error.mockReset();
    },
  };
};

const getDirectoriesClientMock = () => {
  return {
    getUsersByIds: jest.fn(),
    getById: jest.fn(),
    mockResetAll: function () {
      this.getUsersByIds.mockReset();
      this.getById.mockReset();

    },
  };
};

module.exports = {
  getDefaultConfig,
  getDirectoriesClientMock,
  getOrganisationsClientMock,
  getLoggerMock,
};
