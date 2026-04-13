"use strict";

const os = require("os");
const path = require("path");

const kSystemBinDir = "/usr/local/bin";

/**
 * Returns the directory where alphaclaw should install shim binaries.
 *
 * Strategy:
 *   - macOS: always use ~/.local/bin (user-space, SIP-safe, standard XDG convention)
 *   - Linux: use /usr/local/bin when writable (Docker/root), else managedBinDir
 *
 * @param {object} [opts]
 * @param {string}   [opts.platform]       - os.platform() value (injectable for tests)
 * @param {Function} [opts.isWritable]     - (path) => boolean (injectable for tests)
 * @param {Function} [opts.homedir]        - () => string (injectable for tests)
 * @param {string}   [opts.managedBinDir]  - internal fallback dir (set by caller)
 * @returns {string}
 */
const getBinPath = ({
  platform = os.platform(),
  isWritable = (p) => {
    try {
      require("fs").accessSync(p, require("fs").constants.W_OK);
      return true;
    } catch {
      return false;
    }
  },
  homedir = os.homedir,
  managedBinDir = "",
} = {}) => {
  if (platform === "darwin") {
    return path.join(homedir(), ".local", "bin");
  }
  return isWritable(kSystemBinDir) ? kSystemBinDir : managedBinDir;
};

module.exports = { getBinPath, kSystemBinDir };
