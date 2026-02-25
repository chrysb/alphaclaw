#!/usr/bin/env node
"use strict";

const fs = require("fs");
const os = require("os");
const path = require("path");
const { execSync } = require("child_process");

// ---------------------------------------------------------------------------
// Parse CLI flags
// ---------------------------------------------------------------------------

const args = process.argv.slice(2);
const command = args.find((a) => !a.startsWith("-"));

if (!command || command === "help" || args.includes("--help")) {
  console.log(`
Usage: alphaclaw <command> [options]

Commands:
  start     Start the AlphaClaw server (Setup UI + gateway manager)

Options:
  --root-dir <path>   Persistent data directory (default: ~/.alphaclaw)
  --port <number>     Server port (default: 3000)
  --help              Show this help message
`);
  process.exit(0);
}

const flagValue = (flag) => {
  const idx = args.indexOf(flag);
  return idx !== -1 && idx + 1 < args.length ? args[idx + 1] : undefined;
};

// ---------------------------------------------------------------------------
// 1. Resolve root directory (before requiring any lib/ modules)
// ---------------------------------------------------------------------------

const rootDir = flagValue("--root-dir")
  || process.env.ALPHACLAW_ROOT_DIR
  || path.join(os.homedir(), ".alphaclaw");

process.env.ALPHACLAW_ROOT_DIR = rootDir;

const portFlag = flagValue("--port");
if (portFlag) {
  process.env.PORT = portFlag;
}

// ---------------------------------------------------------------------------
// 2. Create directory structure
// ---------------------------------------------------------------------------

const openclawDir = path.join(rootDir, ".openclaw");
fs.mkdirSync(openclawDir, { recursive: true });
console.log(`[alphaclaw] Root directory: ${rootDir}`);

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
// 4. Seed .env from template if missing; load into process.env
// ---------------------------------------------------------------------------

const envFilePath = path.join(rootDir, ".env");
const setupDir = path.join(__dirname, "..", "lib", "setup");

if (!fs.existsSync(envFilePath)) {
  const templatePath = path.join(setupDir, "env.template");
  if (fs.existsSync(templatePath)) {
    fs.copyFileSync(templatePath, envFilePath);
    console.log("[alphaclaw] Created .env from template");
  }
}

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

// ---------------------------------------------------------------------------
// 5. Set OPENCLAW_HOME globally so all child processes inherit it
// ---------------------------------------------------------------------------

process.env.OPENCLAW_HOME = rootDir;
process.env.OPENCLAW_CONFIG_PATH = path.join(openclawDir, "openclaw.json");

// ---------------------------------------------------------------------------
// 6. Install gog (Google Workspace CLI) if not present
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
    execSync(`curl -fsSL "${url}" -o /tmp/gog.tar.gz && tar -xzf /tmp/gog.tar.gz -C /tmp/ && mv /tmp/gog /usr/local/bin/gog && chmod +x /usr/local/bin/gog && rm -f /tmp/gog.tar.gz`, { stdio: "inherit" });
    console.log("[alphaclaw] gog CLI installed");
  } catch (e) {
    console.log(`[alphaclaw] gog install skipped: ${e.message}`);
  }
}

// ---------------------------------------------------------------------------
// 7. Configure gog keyring (file backend for headless environments)
// ---------------------------------------------------------------------------

process.env.GOG_KEYRING_PASSWORD = process.env.GOG_KEYRING_PASSWORD || "alphaclaw";
const gogConfigFile = path.join(openclawDir, "gogcli", "config.json");

if (!fs.existsSync(gogConfigFile)) {
  fs.mkdirSync(path.join(openclawDir, "gogcli"), { recursive: true });
  try {
    execSync("gog auth keyring file", { stdio: "ignore" });
    console.log("[alphaclaw] gog keyring configured (file backend)");
  } catch {}
}

// ---------------------------------------------------------------------------
// 8. Install/reconcile system cron entry
// ---------------------------------------------------------------------------

const hourlyGitSyncPath = path.join(openclawDir, "hourly-git-sync.sh");

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
      try { fs.unlinkSync(cronFilePath); } catch {}
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
// 10. Configure gog credentials (if env vars present)
// ---------------------------------------------------------------------------

if (process.env.GOG_CLIENT_CREDENTIALS_JSON && process.env.GOG_REFRESH_TOKEN) {
  try {
    const tmpCreds = `/tmp/gog-creds-${process.pid}.json`;
    const tmpToken = `/tmp/gog-token-${process.pid}.json`;
    fs.writeFileSync(tmpCreds, process.env.GOG_CLIENT_CREDENTIALS_JSON);
    execSync(`gog auth credentials set "${tmpCreds}"`, { stdio: "ignore" });
    fs.unlinkSync(tmpCreds);
    fs.writeFileSync(tmpToken, JSON.stringify({
      email: process.env.GOG_ACCOUNT || "",
      refresh_token: process.env.GOG_REFRESH_TOKEN,
    }));
    execSync(`gog auth tokens import "${tmpToken}"`, { stdio: "ignore" });
    fs.unlinkSync(tmpToken);
    console.log(`[alphaclaw] gog CLI configured for ${process.env.GOG_ACCOUNT || "account"}`);
  } catch (e) {
    console.log(`[alphaclaw] gog credentials setup skipped: ${e.message}`);
  }
} else {
  console.log("[alphaclaw] Google credentials not set -- skipping gog setup");
}

// ---------------------------------------------------------------------------
// 11. Reconcile channels if already onboarded
// ---------------------------------------------------------------------------

const configPath = path.join(openclawDir, "openclaw.json");

if (fs.existsSync(configPath)) {
  console.log("[alphaclaw] Config exists, reconciling channels...");

  const githubToken = process.env.GITHUB_TOKEN;
  const githubRepo = process.env.GITHUB_WORKSPACE_REPO;
  if (githubToken && githubRepo && fs.existsSync(path.join(openclawDir, ".git"))) {
    const repoUrl = githubRepo
      .replace(/^git@github\.com:/, "")
      .replace(/^https:\/\/github\.com\//, "")
      .replace(/\.git$/, "");
    const remoteUrl = `https://${githubToken}@github.com/${repoUrl}.git`;
    try {
      execSync(`git remote set-url origin "${remoteUrl}"`, { cwd: openclawDir, stdio: "ignore" });
      console.log("[alphaclaw] Repo ready");
    } catch {}
  }

  try {
    const cfg = JSON.parse(fs.readFileSync(configPath, "utf8"));
    if (!cfg.channels) cfg.channels = {};
    if (!cfg.plugins) cfg.plugins = {};
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

    if (changed) {
      let content = JSON.stringify(cfg, null, 2);
      const replacements = [
        [process.env.OPENCLAW_GATEWAY_TOKEN, "${OPENCLAW_GATEWAY_TOKEN}"],
        [process.env.ANTHROPIC_API_KEY, "${ANTHROPIC_API_KEY}"],
        [process.env.ANTHROPIC_TOKEN, "${ANTHROPIC_TOKEN}"],
        [process.env.TELEGRAM_BOT_TOKEN, "${TELEGRAM_BOT_TOKEN}"],
        [process.env.DISCORD_BOT_TOKEN, "${DISCORD_BOT_TOKEN}"],
        [process.env.OPENAI_API_KEY, "${OPENAI_API_KEY}"],
        [process.env.GEMINI_API_KEY, "${GEMINI_API_KEY}"],
        [process.env.NOTION_API_KEY, "${NOTION_API_KEY}"],
        [process.env.BRAVE_API_KEY, "${BRAVE_API_KEY}"],
      ];
      for (const [secret, envRef] of replacements) {
        if (secret && secret.length > 8) {
          content = content.split(secret).join(envRef);
        }
      }
      fs.writeFileSync(configPath, content);
      console.log("[alphaclaw] Config updated and sanitized");
    }
  } catch (e) {
    console.error(`[alphaclaw] Channel reconciliation error: ${e.message}`);
  }
} else {
  console.log("[alphaclaw] No config yet -- onboarding will run from the Setup UI");
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
// 13. Start Express server
// ---------------------------------------------------------------------------

console.log("[alphaclaw] Setup complete -- starting server");
require("../lib/server.js");
