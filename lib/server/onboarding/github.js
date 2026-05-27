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
    const base =
      typeof payload?.message === "string" ? payload.message.trim() : "";
    const detail = Array.isArray(payload?.errors)
      ? payload.errors
          .map((e) => (typeof e?.message === "string" ? e.message.trim() : ""))
          .filter(Boolean)
          .join("; ")
      : "";
    if (base && detail) return `${base} (${detail})`;
    if (base) return base;
    if (detail) return detail;
  } catch {}
  return response.statusText || `HTTP ${response.status}`;
};

// Files GitHub may auto-create when initializing a repo — a repo containing
// only these is treated as empty for onboarding purposes.
const kBoilerplateNames = new Set([
  "readme",
  "readme.md",
  "readme.txt",
  "readme.rst",
  "license",
  "license.md",
  "license.txt",
  ".gitignore",
  ".gitattributes",
]);

const repoContainsOnlyBoilerplate = async (repoUrl, ghHeaders) => {
  try {
    const res = await fetch(
      `https://api.github.com/repos/${repoUrl}/contents/`,
      { headers: ghHeaders },
    );
    if (!res.ok) return false;
    const entries = await res.json();
    if (!Array.isArray(entries)) return false;
    if (entries.length === 0) return true;
    return entries.every(
      (e) => e.type === "file" && kBoilerplateNames.has(e.name.toLowerCase()),
    );
  } catch {
    return false;
  }
};

const getNextGithubPageUrl = (linkHeader = "") => {
  const nextLink = String(linkHeader || "")
    .split(",")
    .map((entry) => entry.trim())
    .find((entry) => entry.endsWith('rel="next"'));
  const match = nextLink?.match(/<([^>]+)>/);
  return match?.[1] || "";
};

const findOwnedRepoByName = async ({
  repoUrl,
  repoOwner,
  repoName,
  viewerLogin,
  ghHeaders,
}) => {
  if (
    !repoOwner ||
    !repoName ||
    !viewerLogin ||
    repoOwner.toLowerCase() !== viewerLogin.toLowerCase()
  ) {
    return null;
  }

  let nextUrl =
    "https://api.github.com/user/repos?affiliation=owner&per_page=100&page=1";
  const normalizedRepoUrl = String(repoUrl || "").trim().toLowerCase();
  const normalizedRepoName = String(repoName || "").trim().toLowerCase();

  while (nextUrl) {
    const res = await fetch(nextUrl, { headers: ghHeaders });
    if (!res.ok) return null;

    const repos = await res.json();
    if (!Array.isArray(repos)) return null;

    const existingRepo = repos.find((repo) => {
      const fullName = String(repo?.full_name || "").trim().toLowerCase();
      const name = String(repo?.name || "").trim().toLowerCase();
      return fullName === normalizedRepoUrl || name === normalizedRepoName;
    });
    if (existingRepo) return existingRepo;

    nextUrl = getNextGithubPageUrl(res.headers?.get?.("link"));
  }

  return null;
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
  const [repoOwner = "", repoName = ""] = String(repoUrl || "").split("/");
  const isExisting = mode === "existing";
  let viewerLogin = "";

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
    const userPayload = await userRes.json().catch(() => ({}));
    viewerLogin = String(userPayload?.login || "").trim();

    const checkRes = await fetch(`https://api.github.com/repos/${repoUrl}`, {
      headers: ghHeaders,
    });
    if (checkRes.status === 404) {
      const hiddenOwnedRepo = await findOwnedRepoByName({
        repoUrl,
        repoOwner,
        repoName,
        viewerLogin,
        ghHeaders,
      });
      if (hiddenOwnedRepo) {
        return {
          ok: false,
          status: 400,
          error:
            `Repository "${repoUrl}" already exists, but this token cannot inspect it. ` +
            "Choose a different repo name or use a token that can access that repo.",
        };
      }
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
        const onlyBoilerplate = await repoContainsOnlyBoilerplate(
          repoUrl,
          ghHeaders,
        );
        if (onlyBoilerplate) {
          return { ok: true, repoExists: true, repoIsEmpty: true };
        }
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
      if (
        String(details || "")
          .toLowerCase()
          .includes("name already exists on this account")
      ) {
        return {
          ok: false,
          status: 400,
          error:
            `Repository "${repoUrl}" already exists. ` +
            "Choose a different repo name or use a token that can access that repo.",
        };
      }
      const hint =
        createRes.status === 404 || createRes.status === 403
          ? ' Ensure your token is a classic PAT with the "repo" scope.'
          : "";
      return {
        ok: false,
        status: 400,
        error: `Failed to create repo: ${details.replace(/\.$/, "")}${hint ? `. ${hint.trim()}` : ""}`,
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
