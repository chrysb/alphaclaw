const ensureGithubRepoAccessible = async ({ repoUrl, repoName, remoteUrl, githubToken }) => {
  void remoteUrl;
  const ghHeaders = {
    Authorization: `token ${githubToken}`,
    "User-Agent": "openclaw-railway",
    Accept: "application/vnd.github+json",
  };

  try {
    const checkRes = await fetch(`https://api.github.com/repos/${repoUrl}`, {
      headers: ghHeaders,
    });

    if (checkRes.status === 404) {
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
        const err = await createRes.json().catch(() => ({}));
        return {
          ok: false,
          status: 400,
          error: `Failed to create repo: ${err.message || createRes.statusText}`,
        };
      }
      console.log(`[onboard] Repo ${repoUrl} created`);
      return { ok: true };
    }

    if (checkRes.ok) return { ok: true };

    return {
      ok: false,
      status: 400,
      error: `Cannot access repo "${repoUrl}" — check your token has the "repo" scope`,
    };
  } catch (e) {
    return { ok: false, status: 400, error: `GitHub error: ${e.message}` };
  }
};

module.exports = { ensureGithubRepoAccessible };
