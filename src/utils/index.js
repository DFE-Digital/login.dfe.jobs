const getQueryValueOrDefault = (req, name, defaultValue = undefined) => {
  const casedKeyName = Object.keys(req.query || {}).find(
    (k) => k.toLowerCase() === name.toLowerCase(),
  );
  if (!casedKeyName) {
    return defaultValue;
  }
  return req.query[casedKeyName];
};
const getQueryIntValueOrDefault = (
  req,
  name,
  defaultValue = 0,
  invalidIntValue = undefined,
) => {
  const queryValue = getQueryValueOrDefault(req, name);
  if (!queryValue) {
    return defaultValue;
  }

  const intValue = parseInt(queryValue);
  if (isNaN(intValue)) {
    return invalidIntValue;
  }
  return intValue;
};

module.exports = {
  getQueryValueOrDefault,
  getQueryIntValueOrDefault,
};
