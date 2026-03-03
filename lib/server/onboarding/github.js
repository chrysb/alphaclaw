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

const verifyGithubRepoForOnboarding = async ({ repoUrl, githubToken }) => {
  const ghHeaders = buildGithubHeaders(githubToken);
  const [repoOwner] = String(repoUrl || "").split("/", 1);

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
        error: `Your token needs the "repo" scope to create repositories. Current scopes: ${oauthScopes.join(", ")}`,
      };
    }
    const authedUser = await userRes.json().catch(() => ({}));
    const authedLogin = String(authedUser?.login || "").trim();
    if (
      repoOwner &&
      authedLogin &&
      repoOwner.toLowerCase() !== authedLogin.toLowerCase()
    ) {
      return {
        ok: false,
        status: 400,
        error: `Workspace repo owner must match your token user "${authedLogin}"`,
      };
    }

    const checkRes = await fetch(`https://api.github.com/repos/${repoUrl}`, {
      headers: ghHeaders,
    });
    if (checkRes.status === 404) {
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
        return {
          ok: false,
          status: 400,
          error: `Repository "${repoUrl}" already exists and is not empty.`,
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

module.exports = { ensureGithubRepoAccessible, verifyGithubRepoForOnboarding };
