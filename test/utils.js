const getDefaultConfig = () => {
  return {
    queueStorage: {
      connectionString: "redis://test:6379",
    },
    loggerSettings: {
      logLevel: "info",
      coors: {
        info: "red",
        ok: "green",
        error: "yellow",
      },
    },
    notifications: {
      email: {
        type: "disk",
      },
      envName: "unitTestEnv",
    },
  };
};

const getLoggerMock = () => {
  return {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    mockResetAll: function () {
      this.info.mockReset();
      this.warn.mockReset();
      this.error.mockReset();
    },
  };
};

module.exports = {
  getDefaultConfig,
  getLoggerMock,
};
