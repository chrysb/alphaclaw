const path = require("path");
const { kSetupDir, kRootDir } = require("../constants");
const { validateOnboardingInput } = require("./validation");
const {
  ensureGithubRepoAccessible,
  verifyGithubRepoForOnboarding,
} = require("./github");
const {
  buildOnboardArgs,
  writeSanitizedOpenclawConfig,
} = require("./openclaw");
const {
  installControlUiSkill,
  syncBootstrapPromptFiles,
} = require("./workspace");
const {
  installHourlyGitSyncScript,
  installHourlyGitSyncCron,
} = require("./cron");
const { migrateManagedInternalFiles } = require("../internal-files-migration");

const createOnboardingService = ({
  fs,
  constants,
  shellCmd,
  gatewayEnv,
  writeEnvFile,
  reloadEnv,
  resolveGithubRepoUrl,
  resolveModelProvider,
  hasCodexOauthProfile,
  authProfiles,
  ensureGatewayProxyConfig,
  getBaseUrl,
  startGateway,
}) => {
  const { OPENCLAW_DIR, WORKSPACE_DIR } = constants;

  const verifyGithubSetup = async ({
    githubRepoInput,
    githubToken,
    resolveGithubRepoUrl,
  }) => {
    const repoUrl = resolveGithubRepoUrl(githubRepoInput);
    return verifyGithubRepoForOnboarding({ repoUrl, githubToken });
  };

  const completeOnboarding = async ({ req, vars, modelKey }) => {
    const validation = validateOnboardingInput({
      vars,
      modelKey,
      resolveModelProvider,
      hasCodexOauthProfile,
    });
    if (!validation.ok) {
      return {
        status: validation.status,
        body: { ok: false, error: validation.error },
      };
    }

    const {
      varMap,
      githubToken,
      githubRepoInput,
      selectedProvider,
      hasCodexOauth,
    } = validation.data;

    const repoUrl = resolveGithubRepoUrl(githubRepoInput);
    const varsToSave = [
      ...vars.filter((v) => v.value && v.key !== "GITHUB_WORKSPACE_REPO"),
    ];
    varsToSave.push({ key: "GITHUB_WORKSPACE_REPO", value: repoUrl });
    writeEnvFile(varsToSave);
    reloadEnv();

    const remoteUrl = `https://github.com/${repoUrl}.git`;
    const [, repoName] = repoUrl.split("/");
    const repoCheck = await ensureGithubRepoAccessible({
      repoUrl,
      repoName,
      githubToken,
    });
    if (!repoCheck.ok) {
      return {
        status: repoCheck.status,
        body: { ok: false, error: repoCheck.error },
      };
    }

    fs.mkdirSync(OPENCLAW_DIR, { recursive: true });
    fs.mkdirSync(WORKSPACE_DIR, { recursive: true });
    migrateManagedInternalFiles({
      fs,
      openclawDir: OPENCLAW_DIR,
    });
    syncBootstrapPromptFiles({
      fs,
      workspaceDir: WORKSPACE_DIR,
      baseUrl: getBaseUrl(req),
    });

    if (!fs.existsSync(`${OPENCLAW_DIR}/.git`)) {
      await shellCmd(
        `cd ${OPENCLAW_DIR} && git init -b main && git remote add origin "${remoteUrl}" && git config user.email "agent@alphaclaw.md" && git config user.name "AlphaClaw Agent"`,
      );
      console.log("[onboard] Git initialized");
    }

    if (!fs.existsSync(`${OPENCLAW_DIR}/.gitignore`)) {
      fs.copyFileSync(
        path.join(kSetupDir, "gitignore"),
        `${OPENCLAW_DIR}/.gitignore`,
      );
    }

    const onboardArgs = buildOnboardArgs({
      varMap,
      selectedProvider,
      hasCodexOauth,
      workspaceDir: WORKSPACE_DIR,
    });
    await shellCmd(
      `openclaw onboard ${onboardArgs.map((a) => `"${a}"`).join(" ")}`,
      {
        env: {
          ...process.env,
          OPENCLAW_HOME: kRootDir,
          OPENCLAW_CONFIG_PATH: `${OPENCLAW_DIR}/openclaw.json`,
        },
        timeout: 120000,
      },
    );
    console.log("[onboard] Onboard complete");

    await shellCmd(`openclaw models set "${modelKey}"`, {
      env: gatewayEnv(),
      timeout: 30000,
    }).catch((e) => {
      console.error("[onboard] Failed to set model:", e.message);
      throw new Error(
        `Onboarding completed but failed to set model "${modelKey}"`,
      );
    });

    try {
      fs.rmSync(`${WORKSPACE_DIR}/.git`, { recursive: true, force: true });
    } catch {}

    writeSanitizedOpenclawConfig({ fs, openclawDir: OPENCLAW_DIR, varMap });
    authProfiles?.syncConfigAuthReferencesForAgent?.();
    ensureGatewayProxyConfig(getBaseUrl(req));

    installControlUiSkill({
      fs,
      openclawDir: OPENCLAW_DIR,
      baseUrl: getBaseUrl(req),
    });

    installHourlyGitSyncScript({ fs, openclawDir: OPENCLAW_DIR });
    await installHourlyGitSyncCron({ fs, openclawDir: OPENCLAW_DIR });

    try {
      await shellCmd(`alphaclaw git-sync -m "initial setup"`, {
        timeout: 30000,
        env: {
          ...process.env,
          GITHUB_TOKEN: githubToken,
        },
      });
      console.log("[onboard] Initial state committed and pushed");
    } catch (e) {
      console.error("[onboard] Git push error:", e.message);
    }

    startGateway();
    return { status: 200, body: { ok: true } };
  };

  return { completeOnboarding, verifyGithubSetup };
};

module.exports = { createOnboardingService };
