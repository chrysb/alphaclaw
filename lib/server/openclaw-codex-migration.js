const fs = require("fs");
const path = require("path");
const { pathToFileURL } = require("url");

const findOpenclawDistModule = (prefix) => {
  const entryPath = require.resolve("openclaw");
  const distDir = path.dirname(entryPath);
  const filename = fs
    .readdirSync(distDir)
    .find((name) => name.startsWith(`${prefix}-`) && name.endsWith(".js"));
  if (!filename) throw new Error(`OpenClaw migration module not found: ${prefix}`);
  return path.join(distDir, filename);
};

const writeConfig = (configPath, cfg) => {
  fs.writeFileSync(configPath, `${JSON.stringify(cfg, null, 2)}\n`, "utf8");
};

const migrateLegacyCodexState = async ({
  configPath = process.env.OPENCLAW_CONFIG_PATH,
  env = process.env,
} = {}) => {
  if (!configPath || !fs.existsSync(configPath)) {
    return { changed: false, changes: [], warnings: [] };
  }

  const cfg = JSON.parse(fs.readFileSync(configPath, "utf8"));
  const routeModule = await import(
    pathToFileURL(findOpenclawDistModule("codex-route-warnings")).href
  );
  const authModule = await import(
    pathToFileURL(findOpenclawDistModule("doctor-auth-flat-profiles")).href
  );

  const changes = [];
  const warnings = [];
  const routeRepair = routeModule.r({ cfg, env, shouldRepair: true });
  let nextCfg = routeRepair.cfg;
  changes.push(...routeRepair.changes);
  warnings.push(...routeRepair.warnings);

  const profileIdMap = authModule.t({ cfg: nextCfg, env });
  const configAuthRepair = authModule.a(nextCfg, { profileIdMap });
  nextCfg = configAuthRepair.config;
  changes.push(...configAuthRepair.changes);
  warnings.push(...configAuthRepair.warnings);

  if (changes.length > 0) writeConfig(configPath, nextCfg);

  const storeRepair = await authModule.o({ cfg: nextCfg, env });
  changes.push(...storeRepair.changes);
  warnings.push(...storeRepair.warnings);

  const sqliteMigration = await authModule.n({
    cfg: nextCfg,
    env,
    prompter: { confirmAutoFix: async () => true },
  });
  changes.push(...sqliteMigration.changes);
  warnings.push(...sqliteMigration.warnings);
  if (sqliteMigration.configChanged) writeConfig(configPath, nextCfg);

  const sessionRepair = await routeModule.i({
    cfg: nextCfg,
    env,
    shouldRepair: true,
  });
  changes.push(...sessionRepair.changes);
  warnings.push(...sessionRepair.warnings);

  return {
    changed: changes.length > 0,
    changes,
    warnings,
  };
};

module.exports = { migrateLegacyCodexState };
