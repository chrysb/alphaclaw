"use strict";

const fs = require("fs");
const os = require("os");
const path = require("path");
const { execSync } = require("child_process");

const kOpenclawConfigFile = "openclaw.json";

const quoteArg = (value) => `'${String(value || "").replace(/'/g, "'\"'\"'")}'`;

const resolveCurrentBranch = ({ execSyncImpl, openclawDir }) => {
  try {
    return (
      String(
        execSyncImpl("git symbolic-ref --short HEAD", {
          cwd: openclawDir,
          stdio: ["ignore", "pipe", "ignore"],
          encoding: "utf8",
        }),
      ).trim() || "main"
    );
  } catch {
    return "main";
  }
};

const createGitEnv = ({ fsModule, osModule, env, processId }) => {
  const githubToken = String(env.GITHUB_TOKEN || "").trim();
  const gitEnv = { ...env };
  if (!githubToken) {
    return { gitEnv, askPassPath: "" };
  }

  const askPassPath = path.join(
    osModule.tmpdir(),
    `alphaclaw-boot-git-askpass-${processId}.sh`,
  );
  fsModule.writeFileSync(
    askPassPath,
    [
      "#!/usr/bin/env sh",
      'case "$1" in',
      '  *Username*) echo "x-access-token" ;;',
      '  *Password*) echo "${GITHUB_TOKEN:-}" ;;',
      '  *) echo "" ;;',
      "esac",
      "",
    ].join("\n"),
    { mode: 0o700 },
  );
  gitEnv.GITHUB_TOKEN = githubToken;
  gitEnv.GIT_TERMINAL_PROMPT = "0";
  gitEnv.GIT_ASKPASS = askPassPath;
  return { gitEnv, askPassPath };
};

const restoreMissingOpenclawConfigFromRemote = ({
  fsModule = fs,
  osModule = os,
  execSyncImpl = execSync,
  env = process.env,
  logger = console,
  processId = process.pid,
  openclawDir,
  configPath = path.join(openclawDir || "", kOpenclawConfigFile),
} = {}) => {
  if (!openclawDir) {
    throw new Error("openclawDir is required");
  }

  if (fsModule.existsSync(configPath)) {
    logger.log(
      "[alphaclaw] Remote config restore skipped: local openclaw.json already exists",
    );
    return { restored: false, skipped: true, reason: "exists" };
  }

  const branch = resolveCurrentBranch({ execSyncImpl, openclawDir });
  const { gitEnv, askPassPath } = createGitEnv({
    fsModule,
    osModule,
    env,
    processId,
  });

  try {
    execSyncImpl(
      `git ls-remote --exit-code --heads origin ${quoteArg(branch)}`,
      {
        cwd: openclawDir,
        stdio: "ignore",
        env: gitEnv,
      },
    );
    execSyncImpl(`git fetch --quiet origin ${quoteArg(branch)}`, {
      cwd: openclawDir,
      stdio: "ignore",
      env: gitEnv,
    });
    const remoteConfig = String(
      execSyncImpl(`git show ${quoteArg(`origin/${branch}:openclaw.json`)}`, {
        cwd: openclawDir,
        stdio: ["ignore", "pipe", "ignore"],
        encoding: "utf8",
        env: gitEnv,
      }),
    );
    if (!remoteConfig.trim()) {
      logger.log("[alphaclaw] Remote config restore skipped: remote config empty");
      return { restored: false, skipped: true, reason: "empty_remote", branch };
    }
    fsModule.writeFileSync(configPath, remoteConfig);
    logger.log(`[alphaclaw] Restored missing openclaw.json from origin/${branch}`);
    return { restored: true, skipped: false, reason: "missing", branch };
  } catch (e) {
    logger.log(
      `[alphaclaw] Remote config restore skipped: ${String(e.message || "").slice(0, 200)}`,
    );
    return {
      restored: false,
      skipped: true,
      reason: "error",
      branch,
      error: e,
    };
  } finally {
    if (askPassPath) {
      try {
        fsModule.rmSync(askPassPath, { force: true });
      } catch {}
    }
  }
};

const ensureMainUpstream = ({ execSyncImpl = execSync, openclawDir, gitEnv }) => {
  try {
    execSyncImpl("git show-ref --verify --quiet refs/heads/main", {
      cwd: openclawDir,
      stdio: "ignore",
    });
    try {
      execSyncImpl("git rev-parse --abbrev-ref --symbolic-full-name main@{upstream}", {
        cwd: openclawDir,
        stdio: "ignore",
      });
    } catch {
      execSyncImpl("git branch --set-upstream-to=origin/main main", {
        cwd: openclawDir,
        stdio: "ignore",
        env: gitEnv,
      });
      return true;
    }
  } catch {}
  return false;
};

module.exports = {
  ensureMainUpstream,
  restoreMissingOpenclawConfigFromRemote,
};
