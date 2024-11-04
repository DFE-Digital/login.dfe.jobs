const Sequelize = require('sequelize').default;
const { makeConnection } = require('./connection');

const defineUserState = (db) => {
  return db.define('user_state', {
    service_id: {
      type: Sequelize.UUID,
      primaryKey: true,
      allowNull: false,
    },
    user_id: {
      type: Sequelize.UUID,
      primaryKey: true,
      allowNull: false,
    },
    organisation_id: {
      type: Sequelize.INTEGER,
      primaryKey: true,
      allowNull: false,
    },
    last_action_sent: {
      type: Sequelize.STRING,
      allowNull: true,
    },
  }, {
    timestamps: true,
    tableName: 'user_state',
    schema: 'service_notifications',
  });
};
const defineRoleState = (db) => {
  return db.define('role_state', {
    service_id: {
      type: Sequelize.UUID,
      primaryKey: true,
      allowNull: false,
    },
    role_id: {
      type: Sequelize.UUID,
      primaryKey: true,
      allowNull: false,
    },
    last_action_sent: {
      type: Sequelize.STRING,
      allowNull: true,
    },
  }, {
    timestamps: true,
    tableName: 'role_state',
    schema: 'service_notifications',
  });
};
const defineOrganisationState = (db) => {
  return db.define('organisation_state', {
    service_id: {
      type: Sequelize.UUID,
      primaryKey: true,
      allowNull: false,
    },
    organisation_id: {
      type: Sequelize.INTEGER,
      primaryKey: true,
      allowNull: false,
    },
    last_action_sent: {
      type: Sequelize.STRING,
      allowNull: true,
    },
  }, {
    timestamps: true,
    tableName: 'organisation_state',
    schema: 'service_notifications',
  });
};

const getRepository = (opts) => {
  const db = makeConnection(opts);

  const userState = defineUserState(db);
  const roleState = defineRoleState(db);
  const organisationState = defineOrganisationState(db);

  return {
    db,
    userState,
    roleState,
    organisationState,
  }
};

module.exports = {
  getRepository,
};
