const path = require("path");
const { execSync } = require("child_process");
const {
  kSetupDir,
  OPENCLAW_DIR,
  ENV_FILE_PATH,
} = require("../constants");
const { renderTopicRegistryMarkdown } = require("../topic-registry");
const { readGoogleState } = require("../google-state");
const {
  readOpenclawConfig,
  writeOpenclawConfig,
} = require("../openclaw-config");
const { reconcileBootstrapExtraFilesEntry } = require("./openclaw");

const resolveSetupUiUrl = (baseUrl) => {
  const normalizedBaseUrl = String(baseUrl || "").trim().replace(/\/+$/, "");
  if (normalizedBaseUrl) return normalizedBaseUrl;

  const railwayPublicDomain = String(process.env.RAILWAY_PUBLIC_DOMAIN || "").trim();
  if (railwayPublicDomain) {
    return `https://${railwayPublicDomain}`;
  }

  const railwayStaticUrl = String(process.env.RAILWAY_STATIC_URL || "").trim().replace(
    /\/+$/,
    "",
  );
  if (railwayStaticUrl) return railwayStaticUrl;

  return "http://localhost:3000";
};

// Single assembly point for AlphaClaw's bootstrap guidance: AGENTS.md +
// the former TOOLS.md template + dynamic account/topic context.
// Idempotent — always rebuilds from source so deploys never clobber topic data.
const isTelegramWorkspaceEnabled = (fs, openclawDir = OPENCLAW_DIR) => {
  try {
    const configPath = `${openclawDir}/openclaw.json`;
    const cfg = JSON.parse(fs.readFileSync(configPath, "utf8"));
    const telegramConfig = cfg.channels?.telegram || {};
    const topLevelGroupCount = Object.keys(telegramConfig.groups || {}).length;
    if (topLevelGroupCount > 0) return true;
    const accounts =
      telegramConfig.accounts && typeof telegramConfig.accounts === "object"
        ? telegramConfig.accounts
        : {};
    for (const accountConfig of Object.values(accounts)) {
      if (Object.keys(accountConfig?.groups || {}).length > 0) return true;
    }
    return false;
  } catch {
    return false;
  }
};

const renderGoogleAccountsMarkdown = (fs, openclawDir = OPENCLAW_DIR) => {
  try {
    const googleStatePath = `${openclawDir}/gogcli/state.json`;
    const state = readGoogleState({ fs, statePath: googleStatePath });
    const accounts = Array.isArray(state.accounts) ? state.accounts : [];
    let section = "\n\n## Available Google Accounts\n\n";
    if (!accounts.length) {
      section += "No Google accounts are currently configured.\n";
      return section;
    }
    section +=
      "Configured in AlphaClaw (use `--client <client> --account <email>` for gog commands):\n\n";
    section += accounts
      .map((account) => {
        const email = String(account.email || "").trim() || "(unknown email)";
        const client = String(account.client || "default").trim() || "default";
        const personal = account.personal ? "personal" : "company";
        const auth = account.authenticated ? "authenticated" : "awaiting sign-in";
        const services = Array.isArray(account.services) ? account.services.join(", ") : "";
        const metaParts = [
          `type: ${personal}`,
          `client: ${client}`,
          `status: ${auth}`,
          services ? `services: ${services}` : null,
        ].filter(Boolean);
        return `- ${email} (${metaParts.join("; ")})`;
      })
      .join("\n");
    section += "\n";
    return section;
  } catch {
    return "";
  }
};

const resolveAllAgentWorkspaces = (fs, openclawDir = OPENCLAW_DIR) => {
  try {
    const configPath = path.join(openclawDir, "openclaw.json");
    const cfg = JSON.parse(fs.readFileSync(configPath, "utf8"));
    const list = Array.isArray(cfg.agents?.list) ? cfg.agents.list : [];
    return list
      .map((entry) => {
        const agentId = String(entry.id || "").trim();
        const workspace = String(entry.workspace || "").trim();
        if (!agentId || !workspace) return null;
        return {
          agentId,
          workspace,
        };
      })
      .filter(Boolean);
  } catch {
    return [];
  }
};

const reconcileBootstrapConfig = ({ fs, openclawDir }) => {
  const configPath = path.join(openclawDir, "openclaw.json");
  if (!fs.existsSync(configPath)) return false;
  const cfg = readOpenclawConfig({
    fsModule: fs,
    openclawDir,
    fallback: null,
  });
  if (!cfg || typeof cfg !== "object") return false;
  if (!cfg.hooks) cfg.hooks = {};
  if (!cfg.hooks.internal) cfg.hooks.internal = {};
  if (!cfg.hooks.internal.entries) cfg.hooks.internal.entries = {};
  cfg.hooks.internal.enabled = true;
  cfg.hooks.internal.entries["bootstrap-extra-files"] =
    reconcileBootstrapExtraFilesEntry(
      cfg.hooks.internal.entries["bootstrap-extra-files"],
    );
  writeOpenclawConfig({ fsModule: fs, openclawDir, config: cfg });
  return true;
};

const syncBootstrapPromptFiles = ({
  fs,
  workspaceDir,
  baseUrl,
  openclawDir = OPENCLAW_DIR,
}) => {
  try {
    const setupUiUrl = resolveSetupUiUrl(baseUrl);

    const toolsTemplate = fs.readFileSync(
      path.join(kSetupDir, "core-prompts", "TOOLS.md"),
      "utf8",
    );
    const includeSyncGuidance = isTelegramWorkspaceEnabled(fs, openclawDir);
    const googleAccountsSection = renderGoogleAccountsMarkdown(fs, openclawDir);
    const buildToolsContent = ({ agentId = "" } = {}) => {
      let toolsContent = toolsTemplate.replace(/\{\{SETUP_UI_URL\}\}/g, setupUiUrl);
      const topicSection = renderTopicRegistryMarkdown({
        includeSyncGuidance,
        agentId,
      });
      if (topicSection) {
        toolsContent += topicSection;
      }
      if (googleAccountsSection) {
        toolsContent += googleAccountsSection;
      }
      return toolsContent;
    };

    const agentsTemplate = fs.readFileSync(
      path.join(kSetupDir, "core-prompts", "AGENTS.md"),
      "utf8",
    );

    const writeToWorkspace = (targetDir, toolsContent) => {
      const bootstrapDir = path.join(targetDir, "hooks", "bootstrap");
      fs.mkdirSync(bootstrapDir, { recursive: true });
      const mergedContent = `${agentsTemplate.trimEnd()}\n\n${toolsContent.trim()}\n`;
      fs.writeFileSync(path.join(bootstrapDir, "AGENTS.md"), mergedContent);
    };

    const syncedWorkspaces = [workspaceDir];
    writeToWorkspace(workspaceDir, buildToolsContent());

    const otherWorkspaces = resolveAllAgentWorkspaces(fs, openclawDir).filter(
      (entry) => path.resolve(entry.workspace) !== path.resolve(workspaceDir),
    );
    for (const entry of otherWorkspaces) {
      try {
        writeToWorkspace(
          entry.workspace,
          buildToolsContent({ agentId: entry.agentId }),
        );
        syncedWorkspaces.push(entry.workspace);
      } catch (e) {
        console.error(
          `[onboard] Bootstrap sync skipped for ${entry.workspace}: ${e.message}`,
        );
      }
    }

    if (reconcileBootstrapConfig({ fs, openclawDir })) {
      for (const targetDir of syncedWorkspaces) {
        fs.rmSync(path.join(targetDir, "hooks", "bootstrap", "TOOLS.md"), {
          force: true,
        });
      }
    }

    console.log("[onboard] Bootstrap prompt file synced");
  } catch (e) {
    console.error("[onboard] Bootstrap prompt sync error:", e.message);
  }
};

const ensureOpenclawRuntimeArtifacts = ({
  fs,
  openclawDir,
  envFilePath = ENV_FILE_PATH,
}) => {
  try {
    const openclawEnvLink = path.join(openclawDir, ".env");
    if (!fs.existsSync(openclawEnvLink) && fs.existsSync(envFilePath)) {
      fs.symlinkSync(envFilePath, openclawEnvLink);
      console.log(`[alphaclaw] Symlinked ${openclawEnvLink} -> ${envFilePath}`);
    }
  } catch (e) {
    console.log(`[alphaclaw] .env symlink skipped: ${e.message}`);
  }

  const gogConfigFile = path.join(openclawDir, "gogcli", "config.json");
  if (!fs.existsSync(gogConfigFile)) {
    fs.mkdirSync(path.join(openclawDir, "gogcli"), { recursive: true });
    try {
      execSync("gog auth keyring file", { stdio: "ignore" });
      console.log("[alphaclaw] gog keyring configured (file backend)");
    } catch {}
  }
};

module.exports = {
  ensureOpenclawRuntimeArtifacts,
  resolveSetupUiUrl,
  syncBootstrapPromptFiles,
};
