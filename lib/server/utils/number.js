const parsePositiveInt = (value, fallbackValue) => {
  const parsed = Number.parseInt(String(value ?? ""), 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallbackValue;
};

module.exports = {
  parsePositiveInt,
};
