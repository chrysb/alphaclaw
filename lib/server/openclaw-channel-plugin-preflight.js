const childProcess = require("child_process");
const {
  findOpenclawPackage,
  resolveOpenclawCliPath,
} = require("./openclaw-doctor-preflight");
const { parseJsonObjectFromNoisyOutput } = require("./utils/json");

const reconcileOpenclawChannelPlugins = ({
  env = process.env,
  execFileSyncImpl = childProcess.execFileSync,
  packageInfo,
  stdio = "inherit",
} = {}) => {
  const resolvedPackageInfo = packageInfo || findOpenclawPackage();
  const coreVersion = String(resolvedPackageInfo.pkg.version || "").trim();
  const cliPath = resolveOpenclawCliPath(resolvedPackageInfo);
  const output = execFileSyncImpl(
    process.execPath,
    [cliPath, "plugins", "list", "--json"],
    {
      env,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
      timeout: 30_000,
    },
  );
  const parsed = parseJsonObjectFromNoisyOutput(output) || {};
  const plugins = Array.isArray(parsed.plugins) ? parsed.plugins : [];
  const staleChannelPlugins = plugins.filter((plugin) => {
    const channelIds = Array.isArray(plugin?.channelIds) ? plugin.channelIds : [];
    return (
      plugin?.enabled === true &&
      plugin?.trustedOfficialInstall === true &&
      channelIds.length > 0 &&
      String(plugin?.version || "").trim() !== coreVersion
    );
  });

  const updated = [];
  for (const plugin of staleChannelPlugins) {
    const pluginId = String(plugin.id || "").trim();
    if (!/^[a-z][a-z0-9_-]{0,63}$/.test(pluginId)) continue;
    execFileSyncImpl(
      process.execPath,
      [
        cliPath,
        "plugins",
        "update",
        pluginId,
        "--accept-capabilities",
        "--acknowledge-install-policy-warning",
      ],
      {
        env,
        stdio,
        timeout: 150_000,
      },
    );
    updated.push({
      id: pluginId,
      fromVersion: String(plugin.version || "").trim() || "unknown",
      toVersion: coreVersion,
    });
  }
  return { updated };
};

module.exports = { reconcileOpenclawChannelPlugins };
