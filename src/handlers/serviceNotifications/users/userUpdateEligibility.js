const getLegacyWsSyncSetting = (application) => {
  const params = application?.relyingParty?.params;
  const explicitFlags = [
    application?.isLegacyWsSync,
    params?.isLegacyWsSync,
    params?.wsLegacySyncEnabled,
  ];
  const configuredFlag = explicitFlags.find((value) => value !== undefined);

  if (configuredFlag === undefined) {
    return { isConfigured: false, enabled: true };
  }

  return {
    isConfigured: true,
    enabled: `${configuredFlag}`.toLowerCase() === "true",
  };
};

const canReceiveUserUpdate = (application) => {
  const params = application?.relyingParty?.params;
  if (!params || params.receiveUserUpdates !== "true") {
    return false;
  }

  // WS updates require a SOAP endpoint. Without this we cannot send.
  if (!params.wsWsdlUrl) {
    return false;
  }

  const setting = getLegacyWsSyncSetting(application);
  if (setting.isConfigured && !setting.enabled) {
    return false;
  }

  return true;
};

module.exports = {
  canReceiveUserUpdate,
};
