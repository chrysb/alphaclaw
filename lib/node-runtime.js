const parseNodeVersion = (value = process.versions.node) => {
  const match = String(value || "").trim().match(/^(\d+)\.(\d+)\.(\d+)/);
  if (!match) return null;
  return match.slice(1).map((part) => Number.parseInt(part, 10));
};

const isAtLeast = (version, minimum) => {
  for (let index = 0; index < minimum.length; index += 1) {
    if (version[index] > minimum[index]) return true;
    if (version[index] < minimum[index]) return false;
  }
  return true;
};

const isSupportedNodeVersion = (value = process.versions.node) => {
  const version = parseNodeVersion(value);
  if (!version) return false;
  const [major] = version;
  if (major === 24) return isAtLeast(version, [24, 16, 0]);
  if (major >= 26) return isAtLeast(version, [26, 1, 0]);
  return false;
};

const getUnsupportedNodeMessage = (value = process.versions.node) =>
  `Node.js ${value} is not supported. AlphaClaw requires Node.js >=24.16.0 <25 or >=26.1.0.`;

const assertSupportedNodeVersion = (value = process.versions.node) => {
  if (isSupportedNodeVersion(value)) return;
  throw new Error(getUnsupportedNodeMessage(value));
};

module.exports = {
  assertSupportedNodeVersion,
  getUnsupportedNodeMessage,
  isSupportedNodeVersion,
  parseNodeVersion,
};
