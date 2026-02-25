const fs = require('fs');
const os = require('os');
const path = require('path');

require('dotenv').config();
const parseJson = (value, fallback) => {
  try {
    if (value === undefined || value === null || value === '') {
      return fallback;
    }
    return JSON.parse(value);
  } catch {
    return fallback;
  }
};

const config = {
  loggerSettings: {
    logLevel: "debug",
    applicationName: "Jobs",
    auditDb: {
      host: process.env.PLATFORM_GLOBAL_SERVER_NAME,
      username: process.env.SVC_SIGNIN_ADT,
      password: process.env.SVC_SIGNIN_ADT_PASSWORD,
      dialect: "mssql",
      name: process.env.PLATFORM_GLOBAL_AUDIT_DATABASE_NAME,
      encrypt: true,
      schema: "dbo",
      pool: {
        max: 20,
        min: 0,
        acquire: 30000,
        idle: 10000
      }
    }
  },
  hostingEnvironment: {
    useDevViews: true,
    env: process.env.LOCAL_ENV || "azure",
    host: process.env.LOCAL_HOST || process.env.STANDALONE_JOBS_HOST_NAME,
    port: process.env.LOCAL_PORT_JOBS || 443,
    sslCert: process.env.LOCAL_SSL_CERT ? process.env.LOCAL_SSL_CERT.replace(/\\n/g, '\n') : "",
    sslKey: process.env.LOCAL_SSL_KEY ? process.env.LOCAL_SSL_KEY.replace(/\\n/g, '\n') : "",
    protocol: "https",
    applicationInsights: process.env.APPLICATIONINSIGHTS_CONNECTION_STRING,
    sessionSecret: process.env.SESSION_ENCRYPTION_SECRET_JOBS,
    agentKeepAlive: {
      maxSockets: 60,
      maxFreeSockets: 10,
      timeout: 60000,
      keepAliveTimeout: 30000
    }
  },
  auth: {
    type: "aad",
    identityMetadata: process.env.TENANT_URL + "/.well-known/openid-configuration",
    clientID: process.env.AAD_SHD_APP_ID
  },
  queueStorage: {
    connectionString: process.env.LOCAL_REDIS_CONN ? process.env.LOCAL_REDIS_CONN + "/4" : process.env.REDIS_CONN + "/4?tls=true"
  },
  persistentStorage: {
    host: process.env.PLATFORM_GLOBAL_SERVER_NAME,
    username: process.env.SVC_SIGNIN_JOBS,
    password: process.env.SVC_SIGNIN_JOBS_PASSWORD,
    dialect: "mssql",
    name: process.env.PLATFORM_GLOBAL_JOBS_DATABASE_NAME,
    encrypt: true,
    schema: "dbo",
    pool: {
      max: 20,
      min: 0,
      acquire: 30000,
      idle: 10000
    }
  },
  notifications: {
    supportEmailAddress: process.env.NOTIF_SUPPORT_EMAIL_ADDRESS,
    interactionsUrl: "https://" + process.env.STANDALONE_INTERACTIONS_HOST_NAME,
    profileUrl: "https://" + process.env.STANDALONE_PROFILE_HOST_NAME,
    servicesUrl: "https://" + process.env.STANDALONE_SERVICES_HOST_NAME,
    helpUrl: "https://" + process.env.STANDALONE_HELP_HOST_NAME,
    slackWebHookUrl: process.env.PLATFORM_GLOBAL_SLACK_FEED,
    envName: process.env.ENVIRONMENT_NAME,
    govNotify: {
        apiKey: process.env.GOVNOTIFY_API_KEY,
        templates: parseJson(process.env.GOVNOTIFY_TEMP_MAP, {})
    },
    organisations: {
      type: "api",
      service: {
        url: "https://" + process.env.STANDALONE_ORGANISATIONS_HOST_NAME,
        auth: {
          type: "aad",
          tenant: process.env.PLATFORM_GLOBAL_TENANT_DOMAIN,
          authorityHostUrl: process.env.TENANT_URL,
          clientId: process.env.AAD_SHD_CLIENT_ID,
          clientSecret: process.env.AAD_SHD_CLIENT_SECRET,
          resource: process.env.AAD_SHD_APP_ID
        }
      }
    },
    directories: {
      type: "api",
      service: {
        url: "https://" + process.env.STANDALONE_DIRECTORIES_HOST_NAME,
        auth: {
          type: "aad",
          tenant: "dfensadev.omicrosoft.com",
          authorityHostUrl: process.env.TENANT_URL,
          clientId: process.env.AAD_SHD_CLIENT_ID,
          clientSecret: process.env.AAD_SHD_CLIENT_SECRET,
          resource: process.env.AAD_SHD_APP_ID
        }
      }
    }
  },
  publicApi: {
    directories: {
      type: "api",
      service: {
        url: "https://" + process.env.STANDALONE_DIRECTORIES_HOST_NAME,
        auth: {
          type: "aad",
          tenant: process.env.PLATFORM_GLOBAL_TENANT_DOMAIN,
          authorityHostUrl: process.env.TENANT_URL,
          clientId: process.env.AAD_SHD_CLIENT_ID,
          clientSecret: process.env.AAD_SHD_CLIENT_SECRET,
          resource: process.env.AAD_SHD_APP_ID
        }
      }
    },
    organisations: {
      type: "api",
      service: {
        url: "https://" + process.env.STANDALONE_ORGANISATIONS_HOST_NAME,
        auth: {
          type: "aad",
          tenant: process.env.PLATFORM_GLOBAL_TENANT_DOMAIN,
          authorityHostUrl: process.env.TENANT_URL,
          clientId: process.env.AAD_SHD_CLIENT_ID,
          clientSecret: process.env.AAD_SHD_CLIENT_SECRET,
          resource: process.env.AAD_SHD_APP_ID
        }
      }
    },
    applications: {
      type: "api",
      service: {
        url: "https://" + process.env.STANDALONE_APPLICATIONS_HOST_NAME,
        auth: {
          type: "aad",
          tenant: process.env.PLATFORM_GLOBAL_TENANT_DOMAIN,
          authorityHostUrl: process.env.TENANT_URL,
          clientId: process.env.AAD_SHD_CLIENT_ID,
          clientSecret: process.env.AAD_SHD_CLIENT_SECRET,
          resource: process.env.AAD_SHD_APP_ID
        }
      }
    },
    auth: {
      jwtSecret: process.env.JOB_JWT_SECRET
    }
  },
  serviceNotifications: {
    access: {
      type: "api",
      service: {
        url: "https://" + process.env.STANDALONE_ACCESS_HOST_NAME,
        auth: {
          type: "aad",
          tenant: "dfensadev.omicrosoft.com",
          authorityHostUrl: process.env.TENANT_URL,
          clientId: process.env.AAD_SHD_CLIENT_ID,
          clientSecret: process.env.AAD_SHD_CLIENT_SECRET,
          resource: process.env.AAD_SHD_APP_ID
        }
      }
    },
    organisations: {
      type: "api",
      service: {
        url: "https://" + process.env.STANDALONE_ORGANISATIONS_HOST_NAME,
        auth: {
          type: "aad",
          tenant: "dfensadev.omicrosoft.com",
          authorityHostUrl: process.env.TENANT_URL,
          clientId: process.env.AAD_SHD_CLIENT_ID,
          clientSecret: process.env.AAD_SHD_CLIENT_SECRET,
          resource: process.env.AAD_SHD_APP_ID
        }
      }
    },
    applications: {
      type: "api",
      service: {
        url: "https://" + process.env.STANDALONE_APPLICATIONS_HOST_NAME,
        auth: {
          type: "aad",
          tenant: "dfensadev.omicrosoft.com",
          authorityHostUrl: process.env.TENANT_URL,
          clientId: process.env.AAD_SHD_CLIENT_ID,
          clientSecret: process.env.AAD_SHD_CLIENT_SECRET,
          resource: process.env.AAD_SHD_APP_ID
        }
      }
    },
    directories: {
      type: "api",
      service: {
        url: "https://" + process.env.STANDALONE_DIRECTORIES_HOST_NAME,
        auth: {
          type: "aad",
          tenant: "dfensadev.omicrosoft.com",
          authorityHostUrl: process.env.TENANT_URL,
          clientId: process.env.AAD_SHD_CLIENT_ID,
          clientSecret: process.env.AAD_SHD_CLIENT_SECRET,
          resource: process.env.AAD_SHD_APP_ID
        }
      }
    }
  },
  adapter: {
    type: "sequelize",
    directories: {
      host: process.env.PLATFORM_GLOBAL_SERVER_NAME,
      username: process.env.SVC_SIGNIN_DIR,
      password: process.env.SVC_SIGNIN_DIR_PASSWORD,
      dialect: "mssql",
      name: process.env.PLATFORM_GLOBAL_DIRECTORIES_DATABASE_NAME,
      encrypt: true,
      schema: "dbo",
      pool: {
        max: 5,
        min: 0,
        acquire: 30000,
        idle: 10000
      }
    },
    organisation: {
      host: process.env.PLATFORM_GLOBAL_SERVER_NAME,
      username: process.env.SVC_SIGNIN_ORG,
      password: process.env.SVC_SIGNIN_ORG_PASSWORD,
      dialect: "mssql",
      name: process.env.PLATFORM_GLOBAL_ORGANISATIONS_DATABASE_NAME,
      encrypt: true,
      schema: "dbo",
      pool: {
        max: 10,
        min: 0,
        acquire: 30000,
        idle: 10000
      }
    }
  },
  entra: {
    useEntraForAccountRegistration: process.env.ENTRA_USE_FOR_ACCOUNT_REGISTRATION?.toLowerCase() === 'true'
  }
}

// Persist configuration to a temporary file and then point the `settings` environment
// variable to the path of the temporary file. The `login.dfe.dao` package can then load
// this configuration.
function mimicLegacySettings(config) {
  // TODO: This can be improved by refactoring the `login.dfe.dao` package.
  const tempDirectoryPath = fs.mkdtempSync(path.join(os.tmpdir(), 'config-'));
  const tempConfigFilePath = path.join(tempDirectoryPath, 'config.json');

  fs.writeFileSync(tempConfigFilePath, JSON.stringify(config), { encoding: 'utf8' });
  process.env.settings = tempConfigFilePath;
}

mimicLegacySettings(config);

module.exports = config;
