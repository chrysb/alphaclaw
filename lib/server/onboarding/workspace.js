const path = require("path");
const { kSetupDir, OPENCLAW_DIR } = require("../constants");
const { renderTopicRegistryMarkdown } = require("../topic-registry");
const { readGoogleState } = require("../google-state");

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

// Single assembly point for TOOLS.md: template + topic registry.
// Idempotent — always rebuilds from source so deploys never clobber topic data.
const isTelegramWorkspaceEnabled = (fs) => {
  try {
    const configPath = `${OPENCLAW_DIR}/openclaw.json`;
    const cfg = JSON.parse(fs.readFileSync(configPath, "utf8"));
    return Object.keys(cfg.channels?.telegram?.groups || {}).length > 0;
  } catch {
    return false;
  }
};

const renderGoogleAccountsMarkdown = (fs) => {
  try {
    const googleStatePath = `${OPENCLAW_DIR}/gogcli/state.json`;
    const state = readGoogleState({ fs, statePath: googleStatePath });
    const accounts = Array.isArray(state.accounts) ? state.accounts : [];
    let section = "\n\n## Available Google Accounts\n\n";
    if (!accounts.length) {
      section += "No Google accounts are currently configured.\n";
      return section;
    }
    section += "Configured in AlphaClaw (use `--account <email>` for gog commands):\n\n";
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

const syncBootstrapPromptFiles = ({ fs, workspaceDir, baseUrl }) => {
  try {
    const setupUiUrl = resolveSetupUiUrl(baseUrl);
    const bootstrapDir = `${workspaceDir}/hooks/bootstrap`;
    fs.mkdirSync(bootstrapDir, { recursive: true });
    fs.copyFileSync(path.join(kSetupDir, "core-prompts", "AGENTS.md"), `${bootstrapDir}/AGENTS.md`);

    const toolsTemplate = fs.readFileSync(path.join(kSetupDir, "core-prompts", "TOOLS.md"), "utf8");
    let toolsContent = toolsTemplate.replace(
      /\{\{SETUP_UI_URL\}\}/g,
      setupUiUrl,
    );

    const topicSection = renderTopicRegistryMarkdown({
      includeSyncGuidance: isTelegramWorkspaceEnabled(fs),
    });
    if (topicSection) {
      toolsContent += topicSection;
    }
    const googleAccountsSection = renderGoogleAccountsMarkdown(fs);
    if (googleAccountsSection) {
      toolsContent += googleAccountsSection;
    }

    fs.writeFileSync(`${bootstrapDir}/TOOLS.md`, toolsContent);
    console.log("[onboard] Bootstrap prompt files synced");
  } catch (e) {
    console.error("[onboard] Bootstrap prompt sync error:", e.message);
  }
};

const installControlUiSkill = ({ fs, openclawDir, baseUrl }) => {
  try {
    const setupUiUrl = resolveSetupUiUrl(baseUrl);
    const skillDir = `${openclawDir}/skills/control-ui`;
    fs.mkdirSync(skillDir, { recursive: true });
    const skillTemplate = fs.readFileSync(path.join(kSetupDir, "skills", "control-ui", "SKILL.md"), "utf8");
    const skillContent = skillTemplate.replace(/\{\{BASE_URL\}\}/g, setupUiUrl);
    fs.writeFileSync(`${skillDir}/SKILL.md`, skillContent);
    console.log(`[onboard] Control UI skill installed (${setupUiUrl})`);
  } catch (e) {
    console.error("[onboard] Skill install error:", e.message);
  }
};

module.exports = { installControlUiSkill, syncBootstrapPromptFiles };
