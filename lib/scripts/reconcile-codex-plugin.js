#!/usr/bin/env node
"use strict";

const { execFileSync } = require("child_process");
const { parseJsonObjectFromNoisyOutput } = require("../server/utils/json");
const pkg = require("../../package.json");

const getPinnedOpenclawVersion = () =>
  String(pkg.dependencies?.openclaw || "").trim();

const getInstalledCodexPlugin = ({ exec = execFileSync } = {}) => {
  try {
    const output = exec("openclaw", ["plugins", "list", "--json"], {
      encoding: "utf8",
      env: process.env,
      stdio: ["ignore", "pipe", "pipe"],
      timeout: 30_000,
    });
    const parsed = parseJsonObjectFromNoisyOutput(output) || {};
    return (parsed.plugins || []).find(
      (plugin) => plugin?.id === "codex" && plugin?.origin === "global",
    );
  } catch {
    return null;
  }
};

const reconcileCodexPlugin = ({ exec = execFileSync, logger = console } = {}) => {
  const expectedVersion = getPinnedOpenclawVersion();
  if (!expectedVersion) return { changed: false, reason: "missing-pin" };

  const installed = getInstalledCodexPlugin({ exec });
  if (!installed) return { changed: false, reason: "not-installed" };
  if (installed.version === expectedVersion) {
    return { changed: false, reason: "current", version: expectedVersion };
  }

  logger.log(
    `[alphaclaw] Updating Codex plugin ${installed.version || "unknown"} -> ${expectedVersion}`,
  );
  exec(
    "openclaw",
    ["plugins", "install", `@openclaw/codex@${expectedVersion}`, "--force"],
    {
      encoding: "utf8",
      env: process.env,
      stdio: "inherit",
      timeout: 120_000,
    },
  );
  return {
    changed: true,
    previousVersion: installed.version || null,
    version: expectedVersion,
  };
};

if (require.main === module) {
  try {
    reconcileCodexPlugin();
  } catch (error) {
    console.warn(
      `[alphaclaw] Codex plugin reconciliation warning: ${error.message}`,
    );
  }
}

module.exports = {
  getInstalledCodexPlugin,
  getPinnedOpenclawVersion,
  reconcileCodexPlugin,
};
