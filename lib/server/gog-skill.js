const path = require("path");
const { readGoogleState } = require("./google-state");

const kSkillPartsDir = path.join(__dirname, "..", "setup", "skills", "gog-cli");

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const uniqueServiceLabels = (scopes) =>
  Array.from(
    new Set(
      (scopes || [])
        .map((scope) => String(scope || "").split(":")[0])
        .filter(Boolean),
    ),
  );

const collectConnectedServices = (accounts) => {
  const serviceSet = new Set();
  for (const account of accounts) {
    if (!account.authenticated) continue;
    for (const label of uniqueServiceLabels(account.services)) {
      serviceSet.add(label);
    }
  }
  return serviceSet;
};

const kServiceDisplayNames = {
  gmail: "Gmail",
  calendar: "Calendar",
  drive: "Drive",
  sheets: "Sheets",
  docs: "Docs",
  tasks: "Tasks",
  contacts: "Contacts",
  meet: "Meet",
};

// Stable ordering for service sections
const kServiceOrder = [
  "gmail",
  "calendar",
  "drive",
  "sheets",
  "docs",
  "tasks",
  "contacts",
  "meet",
];

const readServiceSection = (fs, service) => {
  try {
    return fs.readFileSync(path.join(kSkillPartsDir, `${service}.md`), "utf8");
  } catch {
    return null;
  }
};

// ---------------------------------------------------------------------------
// Skill content builder
// ---------------------------------------------------------------------------

const buildGogSkillContent = ({ fs, accounts }) => {
  const authenticatedAccounts = accounts.filter((a) => a.authenticated);
  if (!authenticatedAccounts.length) return null;

  const connectedServices = collectConnectedServices(authenticatedAccounts);
  if (!connectedServices.size) return null;

  const serviceNames = kServiceOrder
    .filter((svc) => connectedServices.has(svc))
    .map((svc) => kServiceDisplayNames[svc] || svc);

  const lines = [];

  // Frontmatter
  lines.push("---");
  lines.push("name: gog-cli");
  lines.push(
    `description: Google Workspace CLI (gog) — command reference for ${serviceNames.join(", ")}.`,
  );
  lines.push("---");
  lines.push("");

  // Header
  lines.push("# gog — Google Workspace CLI");
  lines.push("");
  lines.push(
    "Fast, script-friendly CLI for Google Workspace. All commands output structured JSON with `--json` or stable TSV with `--plain`.",
  );
  lines.push("");

  // Global flags
  lines.push("## Global Flags");
  lines.push("");
  lines.push("```");
  lines.push("--account <email>   Account to use (or set GOG_ACCOUNT)");
  lines.push("--client <name>     OAuth client (default: \"default\")");
  lines.push("--json              Structured JSON output");
  lines.push("--plain             Stable TSV output (no colors)");
  lines.push("--force             Skip confirmations");
  lines.push("--verbose           Verbose logging");
  lines.push("```");
  lines.push("");

  lines.push("## Runtime Notes");
  lines.push("");
  lines.push(
    "- In AlphaClaw-managed deployments, gog state lives under `$OPENCLAW_STATE_DIR` (typically `/data/.openclaw`).",
  );
  lines.push(
    "- If a direct shell `gog ...` command falls back to `/root/.config/gogcli` or `/root/.openclaw`, rerun it with `XDG_CONFIG_HOME=\"${OPENCLAW_STATE_DIR:-$OPENCLAW_HOME/.openclaw}\"` so gog uses the managed state dir.",
  );
  lines.push(
    "- Always pass `--account <email>` (and `--client <name>` if not \"default\") so gog targets the correct account.",
  );
  lines.push("");

  // Account table
  lines.push("## Connected Accounts");
  lines.push("");
  lines.push("| Email | Client | Services |");
  lines.push("| ----- | ------ | -------- |");
  for (const account of authenticatedAccounts) {
    const email = String(account.email || "").trim() || "(unknown)";
    const client = String(account.client || "default").trim();
    const services = uniqueServiceLabels(account.services).join(", ");
    lines.push(`| ${email} | ${client} | ${services} |`);
  }
  lines.push("");

  // Per-service sections (read from markdown files)
  for (const svc of kServiceOrder) {
    if (!connectedServices.has(svc)) continue;
    const section = readServiceSection(fs, svc);
    if (section) {
      lines.push(section.trimEnd());
      lines.push("");
    }
  }

  return lines.join("\n");
};

// ---------------------------------------------------------------------------
// Installer (reads state, writes SKILL.md)
// ---------------------------------------------------------------------------

const installGogCliSkill = ({ fs, openclawDir }) => {
  try {
    const statePath = path.join(openclawDir, "gogcli", "state.json");
    const state = readGoogleState({ fs, statePath });
    const accounts = Array.isArray(state.accounts) ? state.accounts : [];
    const content = buildGogSkillContent({ fs, accounts });

    const skillDir = path.join(openclawDir, "skills", "gog-cli");

    if (!content) {
      // No authenticated accounts — remove stale skill if present
      const skillPath = path.join(skillDir, "SKILL.md");
      if (fs.existsSync(skillPath)) {
        fs.unlinkSync(skillPath);
        console.log("[gog-skill] Removed stale gog-cli skill (no connected accounts)");
      }
      return;
    }

    fs.mkdirSync(skillDir, { recursive: true });
    fs.writeFileSync(path.join(skillDir, "SKILL.md"), content);
    console.log("[gog-skill] gog-cli skill installed");
  } catch (e) {
    console.error("[gog-skill] Install error:", e.message);
  }
};

module.exports = { buildGogSkillContent, installGogCliSkill };
