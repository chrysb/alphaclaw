const path = require("path");
const { kSetupDir } = require("../constants");

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

const syncBootstrapPromptFiles = ({ fs, workspaceDir, baseUrl }) => {
  try {
    const bootstrapDir = `${workspaceDir}/hooks/bootstrap`;
    fs.mkdirSync(bootstrapDir, { recursive: true });
    fs.copyFileSync(path.join(kSetupDir, "core-prompts", "AGENTS.md"), `${bootstrapDir}/AGENTS.md`);
    const toolsTemplate = fs.readFileSync(path.join(kSetupDir, "core-prompts", "TOOLS.md"), "utf8");
    const toolsContent = toolsTemplate.replace(
      /\{\{SETUP_UI_URL\}\}/g,
      resolveSetupUiUrl(baseUrl),
    );
    fs.writeFileSync(`${bootstrapDir}/TOOLS.md`, toolsContent);
    console.log("[onboard] Bootstrap prompt files synced");
  } catch (e) {
    console.error("[onboard] Bootstrap prompt sync error:", e.message);
  }
};

const installControlUiSkill = ({ fs, openclawDir, baseUrl }) => {
  try {
    const skillDir = `${openclawDir}/skills/control-ui`;
    fs.mkdirSync(skillDir, { recursive: true });
    const skillTemplate = fs.readFileSync(path.join(kSetupDir, "skills", "control-ui", "SKILL.md"), "utf8");
    const skillContent = skillTemplate.replace(/\{\{BASE_URL\}\}/g, baseUrl);
    fs.writeFileSync(`${skillDir}/SKILL.md`, skillContent);
    console.log(`[onboard] Control UI skill installed (${baseUrl})`);
  } catch (e) {
    console.error("[onboard] Skill install error:", e.message);
  }
};

module.exports = { installControlUiSkill, syncBootstrapPromptFiles };
