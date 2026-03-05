const quoteShellArg = (value, options = {}) => {
  const strategy = String(options?.strategy || "double").trim().toLowerCase();
  const normalizedValue = String(value || "");

  if (strategy === "single") {
    return `'${normalizedValue.replace(/'/g, `'\"'\"'`)}'`;
  }
  if (strategy === "double") {
    return `"${normalizedValue.replace(/(["\\$`])/g, "\\$1")}"`;
  }
  throw new Error(`Unsupported shell quote strategy: ${strategy}`);
};

module.exports = {
  quoteShellArg,
};
