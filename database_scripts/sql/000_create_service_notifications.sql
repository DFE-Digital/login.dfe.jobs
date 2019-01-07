IF NOT EXISTS(SELECT 1 FROM INFORMATION_SCHEMA.SCHEMATA WHERE SCHEMA_NAME = 'service_notifications')
  BEGIN
    EXEC('CREATE SCHEMA service_notifications')
  END
GO

IF NOT EXISTS(SELECT 1 FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'user_state' AND TABLE_SCHEMA = 'service_notifications')
  BEGIN
    CREATE TABLE service_notifications.user_state (
      service_id uniqueidentifier NOT NULL,
      user_id uniqueidentifier NOT NULL,
      organisation_id int NOT NULL,
      last_action_sent varchar(50) NULL,
      createdAt datetime2 NOT NULL,
      updatedAt datetime2 NOT NULL,
      CONSTRAINT [PK_ServiceNotifications_UserState] PRIMARY KEY (service_id, user_id, organisation_id)
    )
  END
GO

IF NOT EXISTS(SELECT 1 FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'role_state' AND TABLE_SCHEMA = 'service_notifications')
  BEGIN
    CREATE TABLE service_notifications.role_state (
      service_id uniqueidentifier NOT NULL,
      role_id uniqueidentifier NOT NULL,
      last_action_sent varchar(50) NULL,
      createdAt datetime2 NOT NULL,
      updatedAt datetime2 NOT NULL,
      CONSTRAINT [PK_ServiceNotifications_RoleState] PRIMARY KEY (service_id, role_id)
    )
  END
GO

IF NOT EXISTS(SELECT 1 FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'organisation_state' AND TABLE_SCHEMA = 'service_notifications')
  BEGIN
    CREATE TABLE service_notifications.organisation_state (
      service_id uniqueidentifier NOT NULL,
      organisation_id int NOT NULL,
      last_action_sent varchar(50) NULL,
      createdAt datetime2 NOT NULL,
      updatedAt datetime2 NOT NULL,
      CONSTRAINT [PK_ServiceNotifications_OrganisationState] PRIMARY KEY (service_id, organisation_id)
    )
  END
GO