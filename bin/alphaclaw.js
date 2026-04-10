#!/usr/bin/env node
"use strict";

const fs = require("fs");
const os = require("os");
const path = require("path");
const { execSync } = require("child_process");
const {
  normalizeGitSyncFilePath,
  validateGitSyncFilePath,
  resolveRealGitPath,
  shouldRefreshHourlyGitSyncScript,
} = require("../lib/cli/git-runtime");
const { buildSecretReplacements } = require("../lib/server/helpers");
const {
  migrateManagedInternalFiles,
} = require("../lib/server/internal-files-migration");

const kUsageTrackerPluginPath = path.resolve(
  __dirname,
  "..",
  "lib",
  "plugin",
  "usage-tracker",
);

// ---------------------------------------------------------------------------
// Parse CLI flags
// ---------------------------------------------------------------------------

const args = process.argv.slice(2);

const flagValue = (argv, ...flags) => {
  for (const flag of flags) {
    const idx = argv.indexOf(flag);
    if (idx !== -1 && idx + 1 < argv.length) {
      return argv[idx + 1];
    }
  }
  return undefined;
};

const kGlobalValueFlags = new Set(["--root-dir", "--port"]);
const splitGlobalAndCommandArgs = (argv) => {
  const globalArgs = [];
  let index = 0;
  while (index < argv.length) {
    const token = argv[index];
    if (!token.startsWith("-")) break;
    globalArgs.push(token);
    if (kGlobalValueFlags.has(token) && index + 1 < argv.length) {
      globalArgs.push(argv[index + 1]);
      index += 2;
      continue;
    }
    index += 1;
  }
  return {
    globalArgs,
    commandArgs: argv.slice(index),
  };
};

const { globalArgs, commandArgs } = splitGlobalAndCommandArgs(args);
const command = commandArgs[0];
const commandScope = commandArgs[1];
const commandAction = commandArgs[2];

const pkg = JSON.parse(
  fs.readFileSync(path.join(__dirname, "..", "package.json"), "utf8"),
);

if (
  args.includes("--version") ||
  args.includes("-v") ||
  command === "version"
) {
  console.log(pkg.version);
  process.exit(0);
}

if (!command || command === "help" || args.includes("--help")) {
  console.log(`
alphaclaw v${pkg.version}

Usage: alphaclaw <command> [options]

Commands:
  start     Start the AlphaClaw server (Setup UI + gateway manager)
  git-sync  Commit and push /data/.openclaw safely using GITHUB_TOKEN
  telegram topic add  Add/update Telegram topic mapping by thread ID
  version   Print version

Global options:
--version, -v       Print version
--help              Show this help message

start options:
--root-dir <path>   Persistent data directory (default: ~/.alphaclaw)
--port <number>     Server port (default: 3000)

git-sync options:
  --message, -m <text> Commit message
  --file, -f <path>    Optional file path in .openclaw to sync only one file

telegram topic add options:
  --thread <id>       Telegram thread ID
  --name <text>       Topic name
  --system <text>     Optional system instructions
  --agent <id>        Optional agent ID for per-topic routing
  --group <id>        Optional group ID override (auto-resolves when one group exists)

Examples:
  alphaclaw git-sync --message "sync workspace"
  alphaclaw git-sync --message "update config" --file "workspace/app/config.json"
  alphaclaw telegram topic add --thread 12 --name "Testing"
  alphaclaw telegram topic add --thread 12 --name "Testing" --system "Handle QA requests"
  alphaclaw telegram topic add --thread 12 --name "Ops" --agent ops
`);
  process.exit(0);
}

const quoteArg = (value) => `'${String(value || "").replace(/'/g, "'\"'\"'")}'`;
const resolveGithubRepoPath = (value) =>
  String(value || "")
    .trim()
    .replace(/^git@github\.com:/, "")
    .replace(/^https:\/\/github\.com\//, "")
    .replace(/\.git$/, "");

// ---------------------------------------------------------------------------
// 1. Resolve root directory (before requiring any lib/ modules)
// ---------------------------------------------------------------------------

const rootDir =
  flagValue(args, "--root-dir") ||
  process.env.ALPHACLAW_ROOT_DIR ||
  path.join(os.homedir(), ".alphaclaw");

process.env.ALPHACLAW_ROOT_DIR = rootDir;

const portFlag = flagValue(args, "--port");
if (portFlag) {
  process.env.PORT = portFlag;
}

// ---------------------------------------------------------------------------
// 2. Create directory structure
// ---------------------------------------------------------------------------

const openclawDir = path.join(rootDir, ".openclaw");
fs.mkdirSync(openclawDir, { recursive: true });
const { hourlyGitSyncPath } = migrateManagedInternalFiles({
  fs,
  openclawDir,
});
console.log(`[alphaclaw] Root directory: ${rootDir}`);

// Check for pending update marker (written by the update endpoint before restart).
// In environments where the container filesystem is ephemeral (Railway, etc.),
// the npm install from the update endpoint is lost on restart. This re-runs it
// from the fresh container using the persistent volume marker.
const pendingUpdateMarker = path.join(rootDir, ".alphaclaw-update-pending");
if (fs.existsSync(pendingUpdateMarker)) {
  console.log(
    "[alphaclaw] Pending update detected, installing @chrysb/alphaclaw@latest...",
  );
  const alphaPkgRoot = path.resolve(__dirname, "..");
  const nmIndex = alphaPkgRoot.lastIndexOf(
    `${path.sep}node_modules${path.sep}`,
  );
  const installDir =
    nmIndex >= 0 ? alphaPkgRoot.slice(0, nmIndex) : alphaPkgRoot;
  try {
    execSync(
      "npm install @chrysb/alphaclaw@latest --omit=dev --prefer-online",
      {
        cwd: installDir,
        stdio: "inherit",
        timeout: 180000,
      },
    );
    fs.unlinkSync(pendingUpdateMarker);
    console.log("[alphaclaw] Update applied successfully");
  } catch (e) {
    console.log(`[alphaclaw] Update install failed: ${e.message}`);
    fs.unlinkSync(pendingUpdateMarker);
  }
}

// ---------------------------------------------------------------------------
// 3. Symlink ~/.openclaw -> <root>/.openclaw
// ---------------------------------------------------------------------------

const homeOpenclawLink = path.join(os.homedir(), ".openclaw");
try {
  if (!fs.existsSync(homeOpenclawLink)) {
    fs.symlinkSync(openclawDir, homeOpenclawLink);
    console.log(`[alphaclaw] Symlinked ${homeOpenclawLink} -> ${openclawDir}`);
  }
} catch (e) {
  console.log(`[alphaclaw] Symlink skipped: ${e.message}`);
}

// ---------------------------------------------------------------------------
// 4. Ensure <rootDir>/.env exists (seed from template if missing)
// ---------------------------------------------------------------------------

const envFilePath = path.join(rootDir, ".env");
const setupDir = path.join(__dirname, "..", "lib", "setup");
const templatePath = path.join(setupDir, "env.template");

try {
  if (!fs.existsSync(envFilePath) && fs.existsSync(templatePath)) {
    fs.copyFileSync(templatePath, envFilePath);
    console.log(`[alphaclaw] Created env at ${envFilePath}`);
  }
} catch (e) {
  console.log(`[alphaclaw] .env setup skipped: ${e.message}`);
}

// ---------------------------------------------------------------------------
// 5. Load .env into process.env
// ---------------------------------------------------------------------------

if (fs.existsSync(envFilePath)) {
  const content = fs.readFileSync(envFilePath, "utf8");
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIdx = trimmed.indexOf("=");
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx);
    const value = trimmed.slice(eqIdx + 1);
    if (value) process.env[key] = value;
  }
  console.log("[alphaclaw] Loaded .env");
}

const runGitSync = () => {
  const githubToken = String(process.env.GITHUB_TOKEN || "").trim();
  const githubRepo = resolveGithubRepoPath(
    process.env.GITHUB_WORKSPACE_REPO || "",
  );
  const commitMessage = String(
    flagValue(commandArgs, "--message", "-m") || "",
  ).trim();
  const requestedFilePath = String(
    flagValue(commandArgs, "--file", "-f") || "",
  ).trim();
  const normalizedFilePath = normalizeGitSyncFilePath(requestedFilePath);
  if (!commitMessage) {
    console.error("[alphaclaw] Missing --message for git-sync");
    return 1;
  }
  if (normalizedFilePath) {
    const pathValidation = validateGitSyncFilePath(normalizedFilePath);
    if (!pathValidation.ok) {
      console.error(pathValidation.error);
      return 1;
    }
  }
  if (!githubToken) {
    console.error("[alphaclaw] Missing GITHUB_TOKEN for git-sync");
    return 1;
  }
  if (!githubRepo) {
    console.error("[alphaclaw] Missing GITHUB_WORKSPACE_REPO for git-sync");
    return 1;
  }
  if (!fs.existsSync(path.join(openclawDir, ".git"))) {
    console.error("[alphaclaw] No git repository at /data/.openclaw");
    return 1;
  }

  const realGitPath = resolveRealGitPath({
    shimPath: "/usr/local/bin/git",
  });
  if (!realGitPath) {
    console.error(
      "[alphaclaw] Missing git binary for git-sync; install git in the runtime image",
    );
    return 1;
  }

  const originUrl = `https://github.com/${githubRepo}.git`;
  let branch = "main";
  try {
    branch =
      String(
        execSync("git symbolic-ref --short HEAD", {
          cwd: openclawDir,
          encoding: "utf8",
          stdio: ["ignore", "pipe", "ignore"],
        }),
      ).trim() || "main";
  } catch {}
  const askPassPath = path.join(
    os.tmpdir(),
    `alphaclaw-git-askpass-${process.pid}.sh`,
  );
  const runGit = (gitCommand, { withAuth = false } = {}) => {
    const cmd = withAuth
      ? `GIT_TERMINAL_PROMPT=0 GIT_ASKPASS=${quoteArg(askPassPath)} ${quoteArg(realGitPath)} ${gitCommand}`
      : `${quoteArg(realGitPath)} ${gitCommand}`;
    return execSync(cmd, {
      cwd: openclawDir,
      stdio: "pipe",
      encoding: "utf8",
      env: {
        ...process.env,
        GITHUB_TOKEN: githubToken,
      },
    });
  };

  try {
    fs.writeFileSync(
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

    runGit(`remote set-url origin ${quoteArg(originUrl)}`);
    runGit(`config user.name ${quoteArg("AlphaClaw Agent")}`);
    runGit(`config user.email ${quoteArg("agent@alphaclaw.md")}`);
    try {
      runGit(`ls-remote --exit-code --heads origin ${quoteArg(branch)}`, {
        withAuth: true,
      });
      runGit(`pull --rebase --autostash origin ${quoteArg(branch)}`, {
        withAuth: true,
      });
    } catch {
      console.log(
        `[alphaclaw] Remote branch "${branch}" not found, skipping pull`,
      );
    }
    if (normalizedFilePath) {
      runGit(`add -A -- ${quoteArg(normalizedFilePath)}`);
    } else {
      runGit("add -A");
    }
    try {
      runGit("diff --cached --quiet");
      console.log("[alphaclaw] No changes to commit");
      return 0;
    } catch {}
    if (normalizedFilePath) {
      runGit(
        `commit -m ${quoteArg(commitMessage)} -- ${quoteArg(normalizedFilePath)}`,
      );
    } else {
      runGit(`commit -m ${quoteArg(commitMessage)}`);
    }
    runGit(`push origin ${quoteArg(branch)}`, { withAuth: true });
    const hash = String(runGit("rev-parse --short HEAD")).trim();
    console.log(`[alphaclaw] Git sync complete (${hash})`);
    console.log(
      `[alphaclaw] Commit URL: https://github.com/${githubRepo}/commit/${hash}`,
    );
    return 0;
  } catch (e) {
    const details = String(e.stderr || e.stdout || e.message || "").trim();
    console.error(`[alphaclaw] git-sync failed: ${details.slice(0, 400)}`);
    return 1;
  } finally {
    try {
      fs.rmSync(askPassPath, { force: true });
    } catch {}
  }
};

if (command === "git-sync") {
  process.exit(runGitSync());
}

const runTelegramTopicAdd = () => {
  const topicName = String(flagValue(commandArgs, "--name") || "").trim();
  const threadId = String(flagValue(commandArgs, "--thread") || "").trim();
  const systemInstructions = String(
    flagValue(commandArgs, "--system") || "",
  ).trim();
  const agentId = String(flagValue(commandArgs, "--agent") || "").trim();
  const requestedGroupId = String(
    flagValue(commandArgs, "--group") || "",
  ).trim();
  if (!threadId) {
    console.error("[alphaclaw] Missing --thread for telegram topic add");
    return 1;
  }
  if (!topicName) {
    console.error("[alphaclaw] Missing --name for telegram topic add");
    return 1;
  }

  const configPath = path.join(openclawDir, "openclaw.json");
  if (!fs.existsSync(configPath)) {
    console.error("[alphaclaw] Missing openclaw.json. Run setup first.");
    return 1;
  }

  try {
    const cfg = JSON.parse(fs.readFileSync(configPath, "utf8"));
    const configuredGroups = Object.keys(cfg.channels?.telegram?.groups || {});
    let groupId = requestedGroupId;
    if (!groupId) {
      if (configuredGroups.length === 1) {
        [groupId] = configuredGroups;
      } else if (configuredGroups.length === 0) {
        console.error(
          "[alphaclaw] No Telegram group configured. Configure Telegram workspace first.",
        );
        return 1;
      } else {
        console.error(
          "[alphaclaw] Multiple Telegram groups detected. Provide --group <groupId>.",
        );
        return 1;
      }
    }

    const topicRegistry = require("../lib/server/topic-registry");
    const {
      syncConfigForTelegram,
    } = require("../lib/server/telegram-workspace");
    const {
      syncBootstrapPromptFiles,
    } = require("../lib/server/onboarding/workspace");
    topicRegistry.updateTopic(groupId, threadId, {
      name: topicName,
      ...(systemInstructions ? { systemInstructions } : {}),
      ...(agentId ? { agentId } : {}),
    });

    const requireMention =
      !!cfg.channels?.telegram?.groups?.[groupId]?.requireMention;
    const syncResult = syncConfigForTelegram({
      fs,
      openclawDir,
      topicRegistry,
      groupId,
      requireMention,
      resolvedUserId: "",
    });
    syncBootstrapPromptFiles({
      fs,
      workspaceDir: path.join(openclawDir, "workspace"),
    });

    const agentSuffix = agentId ? ` agent=${agentId}` : "";
    console.log(
      `[alphaclaw] Topic mapped: group=${groupId} thread=${threadId} name=${topicName}${agentSuffix}`,
    );
    console.log(
      `[alphaclaw] Concurrency updated: agent=${syncResult.maxConcurrent} subagents=${syncResult.subagentMaxConcurrent} topics=${syncResult.totalTopics}`,
    );
    return 0;
  } catch (e) {
    console.error(`[alphaclaw] telegram topic add failed: ${e.message}`);
    return 1;
  }
};

if (
  command === "telegram" &&
  commandScope === "topic" &&
  commandAction === "add"
) {
  process.exit(runTelegramTopicAdd());
}

const kPort = String(process.env.PORT || "3000").trim();
if (kPort === "18789") {
  console.error(
    [
      "[alphaclaw] Fatal config error: AlphaClaw cannot be started on port 18789.",
      "[alphaclaw] Port 18789 is reserved for the OpenClaw gateway.",
    ].join("\n"),
  );
  process.exit(1);
}

const kSetupPassword = String(process.env.SETUP_PASSWORD || "").trim();
if (!kSetupPassword) {
  console.error(
    [
      "[alphaclaw] Fatal config error: SETUP_PASSWORD is missing or empty.",
      "[alphaclaw] Set SETUP_PASSWORD in your deployment environment variables and restart.",
      "[alphaclaw] Examples:",
      "[alphaclaw] - Render: Dashboard -> Environment -> Add SETUP_PASSWORD",
      "[alphaclaw] - Railway: Project -> Variables -> Add SETUP_PASSWORD",
    ].join("\n"),
  );
  process.exit(1);
}

// ---------------------------------------------------------------------------
// 7. Set OPENCLAW_HOME globally so all child processes inherit it
// ---------------------------------------------------------------------------

process.env.OPENCLAW_HOME = rootDir;
process.env.OPENCLAW_CONFIG_PATH = path.join(openclawDir, "openclaw.json");
process.env.GOG_KEYRING_PASSWORD =
  process.env.GOG_KEYRING_PASSWORD || "alphaclaw";

// ---------------------------------------------------------------------------
// 8. Install gog (Google Workspace CLI) if not present
// ---------------------------------------------------------------------------

process.env.XDG_CONFIG_HOME = openclawDir;

const gogInstalled = (() => {
  try {
    execSync("command -v gog", { stdio: "ignore" });
    return true;
  } catch {
    return false;
  }
})();

if (!gogInstalled) {
  console.log("[alphaclaw] Installing gog CLI...");
  try {
    const gogVersion = process.env.GOG_VERSION || "0.11.0";
    const platform = os.platform() === "darwin" ? "darwin" : "linux";
    const arch = os.arch() === "arm64" ? "arm64" : "amd64";
    const tarball = `gogcli_${gogVersion}_${platform}_${arch}.tar.gz`;
    const url = `https://github.com/steipete/gogcli/releases/download/v${gogVersion}/${tarball}`;
    execSync(
      `curl -fsSL "${url}" -o /tmp/gog.tar.gz && tar -xzf /tmp/gog.tar.gz -C /tmp/ && mv /tmp/gog /usr/local/bin/gog && chmod +x /usr/local/bin/gog && rm -f /tmp/gog.tar.gz`,
      { stdio: "inherit" },
    );
    console.log("[alphaclaw] gog CLI installed");
  } catch (e) {
    console.log(`[alphaclaw] gog install skipped: ${e.message}`);
  }
}

// ---------------------------------------------------------------------------
// 9. Install/reconcile system cron entry
// ---------------------------------------------------------------------------

const packagedHourlyGitSyncPath = path.join(setupDir, "hourly-git-sync.sh");

try {
  if (fs.existsSync(packagedHourlyGitSyncPath)) {
    const packagedSyncScript = fs.readFileSync(
      packagedHourlyGitSyncPath,
      "utf8",
    );
    const installedSyncScript = fs.existsSync(hourlyGitSyncPath)
      ? fs.readFileSync(hourlyGitSyncPath, "utf8")
      : "";
    if (
      shouldRefreshHourlyGitSyncScript({
        packagedSyncScript,
        installedSyncScript,
      })
    ) {
      fs.writeFileSync(hourlyGitSyncPath, packagedSyncScript, { mode: 0o755 });
      console.log("[alphaclaw] Refreshed hourly git sync script");
    }
  }
} catch (e) {
  console.log(
    `[alphaclaw] Hourly git sync script refresh skipped: ${e.message}`,
  );
}

if (fs.existsSync(hourlyGitSyncPath)) {
  try {
    const syncCronConfig = path.join(openclawDir, "cron", "system-sync.json");
    let cronEnabled = true;
    let cronSchedule = "0 * * * *";

    if (fs.existsSync(syncCronConfig)) {
      try {
        const cfg = JSON.parse(fs.readFileSync(syncCronConfig, "utf8"));
        cronEnabled = cfg.enabled !== false;
        const schedule = String(cfg.schedule || "").trim();
        if (/^(\S+\s+){4}\S+$/.test(schedule)) cronSchedule = schedule;
      } catch {}
    }

    const cronFilePath = "/etc/cron.d/openclaw-hourly-sync";
    if (cronEnabled) {
      const cronContent = [
        "SHELL=/bin/bash",
        "PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin",
        `${cronSchedule} root bash "${hourlyGitSyncPath}" >> /var/log/openclaw-hourly-sync.log 2>&1`,
        "",
      ].join("\n");
      fs.writeFileSync(cronFilePath, cronContent, { mode: 0o644 });
      console.log("[alphaclaw] System cron entry installed");
    } else {
      try {
        fs.unlinkSync(cronFilePath);
      } catch {}
      console.log("[alphaclaw] System cron entry disabled");
    }
  } catch (e) {
    console.log(`[alphaclaw] Cron setup skipped: ${e.message}`);
  }
}

// ---------------------------------------------------------------------------
// 9. Start cron daemon if available
// ---------------------------------------------------------------------------

try {
  execSync("command -v cron", { stdio: "ignore" });
  try {
    execSync("pgrep -x cron", { stdio: "ignore" });
  } catch {
    execSync("cron", { stdio: "ignore" });
  }
  console.log("[alphaclaw] Cron daemon running");
} catch {}

// ---------------------------------------------------------------------------
// 10. Reconcile channels if already onboarded
// ---------------------------------------------------------------------------

const configPath = path.join(openclawDir, "openclaw.json");

if (fs.existsSync(configPath)) {
  console.log("[alphaclaw] Config exists, reconciling channels...");

  const githubRepo = process.env.GITHUB_WORKSPACE_REPO;
  if (fs.existsSync(path.join(openclawDir, ".git"))) {
    if (githubRepo) {
      const repoUrl = githubRepo
        .replace(/^git@github\.com:/, "")
        .replace(/^https:\/\/github\.com\//, "")
        .replace(/\.git$/, "");
      const remoteUrl = `https://github.com/${repoUrl}.git`;
      try {
        execSync(`git remote set-url origin "${remoteUrl}"`, {
          cwd: openclawDir,
          stdio: "ignore",
        });
        console.log("[alphaclaw] Repo ready");
      } catch {}
    }

    // Migration path: scrub persisted PATs from existing GitHub origin URLs.
    try {
      const existingOrigin = execSync("git remote get-url origin", {
        cwd: openclawDir,
        stdio: ["ignore", "pipe", "ignore"],
        encoding: "utf8",
      }).trim();
      const match = existingOrigin.match(
        /^https:\/\/[^/@]+@github\.com\/(.+)$/i,
      );
      if (match?.[1]) {
        const cleanedPath = String(match[1]).replace(/\.git$/i, "");
        const cleanedOrigin = `https://github.com/${cleanedPath}.git`;
        execSync(`git remote set-url origin "${cleanedOrigin}"`, {
          cwd: openclawDir,
          stdio: "ignore",
        });
        console.log("[alphaclaw] Scrubbed tokenized GitHub remote URL");
      }
    } catch {}

    const bootRestoreConfigFromRemote = () => {
      const branch = (() => {
        try {
          return (
            String(
              execSync("git symbolic-ref --short HEAD", {
                cwd: openclawDir,
                stdio: ["ignore", "pipe", "ignore"],
                encoding: "utf8",
              }),
            ).trim() || "main"
          );
        } catch {
          return "main";
        }
      })();
      const githubToken = String(process.env.GITHUB_TOKEN || "").trim();
      const gitEnv = { ...process.env };
      const askPassPath = path.join(
        os.tmpdir(),
        `alphaclaw-boot-git-askpass-${process.pid}.sh`,
      );
      try {
        if (githubToken) {
          fs.writeFileSync(
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
        }
        execSync(`git ls-remote --exit-code --heads origin "${branch}"`, {
          cwd: openclawDir,
          stdio: "ignore",
          env: gitEnv,
        });
        execSync(`git fetch --quiet origin "${branch}"`, {
          cwd: openclawDir,
          stdio: "ignore",
          env: gitEnv,
        });
        try {
          execSync("git show-ref --verify --quiet refs/heads/main", {
            cwd: openclawDir,
            stdio: "ignore",
          });
          try {
            execSync("git rev-parse --abbrev-ref --symbolic-full-name main@{upstream}", {
              cwd: openclawDir,
              stdio: "ignore",
            });
          } catch {
            execSync("git branch --set-upstream-to=origin/main main", {
              cwd: openclawDir,
              stdio: "ignore",
              env: gitEnv,
            });
            console.log("[alphaclaw] Set main upstream to origin/main");
          }
        } catch {}
        const remoteConfig = String(
          execSync(`git show "origin/${branch}:openclaw.json"`, {
            cwd: openclawDir,
            stdio: ["ignore", "pipe", "ignore"],
            encoding: "utf8",
            env: gitEnv,
          }),
        );
        if (remoteConfig.trim()) {
          fs.writeFileSync(configPath, remoteConfig);
          console.log(
            `[alphaclaw] Restored openclaw.json from origin/${branch}`,
          );
        }
      } catch (e) {
        console.log(
          `[alphaclaw] Remote config restore skipped: ${String(e.message || "").slice(0, 200)}`,
        );
      } finally {
        if (githubToken) {
          try {
            fs.rmSync(askPassPath, { force: true });
          } catch {}
        }
      }
    };
    bootRestoreConfigFromRemote();
  }

  try {
    const cfg = JSON.parse(fs.readFileSync(configPath, "utf8"));
    if (!cfg.channels) cfg.channels = {};
    if (!cfg.plugins) cfg.plugins = {};
    if (!cfg.plugins.load) cfg.plugins.load = {};
    if (!Array.isArray(cfg.plugins.load.paths)) cfg.plugins.load.paths = [];
    if (!cfg.plugins.entries) cfg.plugins.entries = {};
    let changed = false;

    if (process.env.TELEGRAM_BOT_TOKEN && !cfg.channels.telegram) {
      cfg.channels.telegram = {
        enabled: true,
        botToken: process.env.TELEGRAM_BOT_TOKEN,
        dmPolicy: "pairing",
        groupPolicy: "allowlist",
      };
      cfg.plugins.entries.telegram = { enabled: true };
      console.log("[alphaclaw] Telegram added");
      changed = true;
    }

    if (process.env.DISCORD_BOT_TOKEN && !cfg.channels.discord) {
      cfg.channels.discord = {
        enabled: true,
        token: process.env.DISCORD_BOT_TOKEN,
        dmPolicy: "pairing",
        groupPolicy: "allowlist",
      };
      cfg.plugins.entries.discord = { enabled: true };
      console.log("[alphaclaw] Discord added");
      changed = true;
    }
    if (!cfg.plugins.load.paths.includes(kUsageTrackerPluginPath)) {
      cfg.plugins.load.paths.push(kUsageTrackerPluginPath);
      changed = true;
    }
    if (cfg.plugins.entries["usage-tracker"]?.enabled !== true) {
      cfg.plugins.entries["usage-tracker"] = { enabled: true };
      changed = true;
    }

    if (changed) {
      let content = JSON.stringify(cfg, null, 2);
      const replacements = buildSecretReplacements(process.env);
      for (const [secret, envRef] of replacements) {
        if (secret) {
          // Only replace the secret if it is an exact match for a JSON string value
          // This ensures we do not replace substrings inside other strings
          const secretJson = JSON.stringify(secret);
          content = content.replace(
            new RegExp(
              secretJson.replace(/[-\/\\^$*+?.()|[\]{}]/g, "\\$&"),
              "g",
            ),
            JSON.stringify(envRef),
          );
        }
      }
      fs.writeFileSync(configPath, content);
      console.log("[alphaclaw] Config updated and sanitized");
    }
  } catch (e) {
    console.error(`[alphaclaw] Channel reconciliation error: ${e.message}`);
  }
} else {
  console.log(
    "[alphaclaw] No config yet -- onboarding will run from the Setup UI",
  );
}

// ---------------------------------------------------------------------------
// 12. Install systemctl shim if in Docker (no real systemd)
// ---------------------------------------------------------------------------

try {
  execSync("command -v systemctl", { stdio: "ignore" });
} catch {
  const shimSrc = path.join(__dirname, "..", "lib", "scripts", "systemctl");
  const shimDest = "/usr/local/bin/systemctl";
  try {
    fs.copyFileSync(shimSrc, shimDest);
    fs.chmodSync(shimDest, 0o755);
    console.log("[alphaclaw] systemctl shim installed");
  } catch (e) {
    console.log(`[alphaclaw] systemctl shim skipped: ${e.message}`);
  }
}

// ---------------------------------------------------------------------------
// 13. Install git auth shim
// ---------------------------------------------------------------------------

try {
  const gitAskPassSrc = path.join(__dirname, "..", "lib", "scripts", "git-askpass");
  const gitAskPassDest = "/tmp/alphaclaw-git-askpass.sh";
  const gitShimTemplatePath = path.join(__dirname, "..", "lib", "scripts", "git");
  const gitShimDest = "/usr/local/bin/git";

  if (fs.existsSync(gitAskPassSrc)) {
    fs.copyFileSync(gitAskPassSrc, gitAskPassDest);
    fs.chmodSync(gitAskPassDest, 0o755);
  }

  if (fs.existsSync(gitShimTemplatePath)) {
    const realGitPath =
      resolveRealGitPath({
        shimPath: gitShimDest,
      }) || "/usr/bin/git";

    const gitShimTemplate = fs.readFileSync(gitShimTemplatePath, "utf8");
    const gitShimContent = gitShimTemplate
      .replace("@@REAL_GIT@@", realGitPath)
      .replace("@@OPENCLAW_REPO_ROOT@@", openclawDir);
    fs.writeFileSync(gitShimDest, gitShimContent, { mode: 0o755 });
    console.log("[alphaclaw] git auth shim installed");
  }
} catch (e) {
  console.log(`[alphaclaw] git auth shim skipped: ${e.message}`);
}

// ---------------------------------------------------------------------------
// 14. Start Express server
// ---------------------------------------------------------------------------

console.log("[alphaclaw] Setup complete -- starting server");
require("../lib/server.js");
