const fs = require("fs");
const os = require("os");
const path = require("path");
const crypto = require("crypto");
const {
  kImportTempPrefix,
  isValidImportTempDir,
} = require("./import/import-temp");

const buildGithubHeaders = (githubToken) => ({
  Authorization: `token ${githubToken}`,
  "User-Agent": "openclaw-railway",
  Accept: "application/vnd.github+json",
});

const parseGithubErrorMessage = async (response) => {
  try {
    const payload = await response.json();
    if (typeof payload?.message === "string" && payload.message.trim()) {
      return payload.message.trim();
    }
  } catch {}
  return response.statusText || `HTTP ${response.status}`;
};

const isClassicPat = (token) => String(token || "").startsWith("ghp_");
const isFineGrainedPat = (token) =>
  String(token || "").startsWith("github_pat_");

const verifyGithubRepoForOnboarding = async ({
  repoUrl,
  githubToken,
  mode = "new",
}) => {
  const ghHeaders = buildGithubHeaders(githubToken);
  const [repoOwner] = String(repoUrl || "").split("/", 1);
  const isExisting = mode === "existing";

  try {
    const userRes = await fetch("https://api.github.com/user", {
      headers: ghHeaders,
    });
    if (!userRes.ok) {
      const details = await parseGithubErrorMessage(userRes);
      return {
        ok: false,
        status: 400,
        error: `Cannot verify GitHub token: ${details}`,
      };
    }
    if (isClassicPat(githubToken)) {
      const oauthScopes = (userRes.headers?.get?.("x-oauth-scopes") || "")
        .toLowerCase()
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
      if (
        oauthScopes.length > 0 &&
        !oauthScopes.includes("repo") &&
        !oauthScopes.includes("public_repo")
      ) {
        return {
          ok: false,
          status: 400,
          error: `Your token needs the "repo" scope. Current scopes: ${oauthScopes.join(", ")}`,
        };
      }
    }
    await userRes.json().catch(() => ({}));

    const checkRes = await fetch(`https://api.github.com/repos/${repoUrl}`, {
      headers: ghHeaders,
    });
    if (checkRes.status === 404) {
      if (isExisting) {
        return {
          ok: false,
          status: 400,
          error: `Repository "${repoUrl}" not found. Check the repo name and token permissions.`,
        };
      }
      return { ok: true, repoExists: false, repoIsEmpty: false };
    }
    if (checkRes.ok) {
      const commitsRes = await fetch(
        `https://api.github.com/repos/${repoUrl}/commits?per_page=1`,
        { headers: ghHeaders },
      );
      if (commitsRes.status === 409) {
        return { ok: true, repoExists: true, repoIsEmpty: true };
      }
      if (commitsRes.ok) {
        if (isExisting) {
          return { ok: true, repoExists: true, repoIsEmpty: false };
        }
        return {
          ok: false,
          status: 400,
          error: `Repository "${repoUrl}" already exists and is not empty. To import, use "Import existing setup" instead.`,
        };
      }
      const commitCheckDetails = await parseGithubErrorMessage(commitsRes);
      return {
        ok: false,
        status: 400,
        error: `Cannot verify whether repo "${repoUrl}" is empty: ${commitCheckDetails}`,
      };
    }

    const details = await parseGithubErrorMessage(checkRes);
    if (isFineGrainedPat(githubToken) && checkRes.status === 403) {
      return {
        ok: false,
        status: 400,
        error: `Your fine-grained token needs Contents (read/write) and Metadata (read) permissions for "${repoUrl}".`,
      };
    }
    return {
      ok: false,
      status: 400,
      error: `Cannot verify repo "${repoUrl}": ${details}`,
    };
  } catch (e) {
    return {
      ok: false,
      status: 400,
      error: `GitHub verification error: ${e.message}`,
    };
  }
};

const ensureGithubRepoAccessible = async ({
  repoUrl,
  repoName,
  githubToken,
}) => {
  const ghHeaders = buildGithubHeaders(githubToken);
  const verification = await verifyGithubRepoForOnboarding({
    repoUrl,
    githubToken,
  });
  if (!verification.ok) return verification;
  if (verification.repoExists && verification.repoIsEmpty) {
    console.log(`[onboard] Using existing empty repo ${repoUrl}`);
    return { ok: true };
  }

  try {
    console.log(`[onboard] Creating repo ${repoUrl}...`);
    const createRes = await fetch("https://api.github.com/user/repos", {
      method: "POST",
      headers: { ...ghHeaders, "Content-Type": "application/json" },
      body: JSON.stringify({
        name: repoName,
        private: true,
        auto_init: false,
      }),
    });
    if (!createRes.ok) {
      const details = await parseGithubErrorMessage(createRes);
      const hint =
        createRes.status === 404 || createRes.status === 403
          ? ' Ensure your token is a classic PAT with the "repo" scope.'
          : "";
      return {
        ok: false,
        status: 400,
        error: `Failed to create repo: ${details}.${hint}`,
      };
    }
    console.log(`[onboard] Repo ${repoUrl} created`);
    return { ok: true };
  } catch (e) {
    return { ok: false, status: 400, error: `GitHub error: ${e.message}` };
  }
};

const cloneRepoToTemp = async ({ repoUrl, githubToken, shellCmd }) => {
  const tempId = crypto.randomUUID().slice(0, 8);
  const tempDir = path.join(os.tmpdir(), `${kImportTempPrefix}${tempId}`);
  const askPassPath = path.join(
    os.tmpdir(),
    `alphaclaw-import-askpass-${tempId}.sh`,
  );

  try {
    fs.writeFileSync(
      askPassPath,
      [
        "#!/bin/sh",
        'case "$1" in',
        '  *Username*) printf "%s\\n" "x-access-token" ;;',
        '  *) printf "%s\\n" "$ALPHACLAW_GITHUB_TOKEN" ;;',
        "esac",
        "",
      ].join("\n"),
      { mode: 0o700 },
    );
    await shellCmd(
      `git clone --depth=1 "https://github.com/${repoUrl}.git" "${tempDir}"`,
      {
        timeout: 60000,
        env: {
          ...process.env,
          GIT_ASKPASS: askPassPath,
          GIT_TERMINAL_PROMPT: "0",
          ALPHACLAW_GITHUB_TOKEN: githubToken,
        },
      },
    );
    console.log(`[onboard] Cloned ${repoUrl} to ${tempDir}`);
    return { ok: true, tempDir };
  } catch (e) {
    return {
      ok: false,
      error: `Failed to clone repo: ${e.message}`,
    };
  } finally {
    try {
      fs.rmSync(askPassPath, { force: true });
    } catch {}
  }
};

const cleanupTempClone = (tempDir) => {
  try {
    if (isValidImportTempDir(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
      console.log(`[onboard] Cleaned up temp clone ${tempDir}`);
    }
  } catch (e) {
    console.error(`[onboard] Temp cleanup error: ${e.message}`);
  }
};

module.exports = {
  ensureGithubRepoAccessible,
  verifyGithubRepoForOnboarding,
  cloneRepoToTemp,
  cleanupTempClone,
};
