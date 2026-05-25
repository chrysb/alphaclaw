const path = require("path");

const kRuntimeOpenclaw = "openclaw";
const kRuntimeDenchclaw = "denchclaw";

const normalizeRuntimeId = (value) => {
  const normalized = String(value || "")
    .trim()
    .toLowerCase();
  if (["dench", "denchclaw", "dench-claw"].includes(normalized)) {
    return kRuntimeDenchclaw;
  }
  return kRuntimeOpenclaw;
};

const parsePositiveInt = (value, fallback) => {
  const parsed = Number.parseInt(String(value || ""), 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

const shellJoin = (parts) => parts.filter(Boolean).join(" ");

const createClawRuntime = ({ rootDir, env = process.env } = {}) => {
  const runtimeId = normalizeRuntimeId(
    env.ALPHACLAW_CLAW_RUNTIME || env.ALPHACLAW_OPENCLAW_RUNTIME,
  );
  const isDenchclaw = runtimeId === kRuntimeDenchclaw;
  const stateDirName = isDenchclaw ? ".openclaw-dench" : ".openclaw";
  const profile = isDenchclaw ? "dench" : "";
  const profileArgs = profile ? ["--profile", profile] : [];
  const defaultGatewayPort = parsePositiveInt(
    env.ALPHACLAW_GATEWAY_PORT,
    isDenchclaw ? 19001 : 18789,
  );
  const denchWebPort = parsePositiveInt(env.DENCHCLAW_WEB_PORT, 3100);
  const stateDir = path.join(rootDir, stateDirName);
  const command = "openclaw";

  const buildArgs = (args = []) => [
    ...profileArgs,
    ...args.map((arg) => String(arg)),
  ];

  const buildCommand = (subcommand = "") => {
    const prefix = shellJoin([command, ...profileArgs]);
    const suffix = String(subcommand || "").trim();
    return suffix ? `${prefix} ${suffix}` : prefix;
  };

  const envVars = {
    OPENCLAW_STATE_DIR: stateDir,
    OPENCLAW_CONFIG_PATH: path.join(stateDir, "openclaw.json"),
    ...(profile ? { OPENCLAW_PROFILE: profile } : {}),
    ...(isDenchclaw ? { DENCHCLAW_DAEMONLESS: "1" } : {}),
  };

  return {
    id: runtimeId,
    label: isDenchclaw ? "DenchClaw" : "OpenClaw",
    isDenchclaw,
    command,
    profile,
    profileArgs,
    stateDirName,
    stateDir,
    workspaceDir: path.join(stateDir, "workspace"),
    configPath: path.join(stateDir, "openclaw.json"),
    defaultGatewayPort,
    denchWebPort,
    env: envVars,
    buildArgs,
    buildCommand,
  };
};

module.exports = {
  createClawRuntime,
  kRuntimeDenchclaw,
  kRuntimeOpenclaw,
  normalizeRuntimeId,
};
