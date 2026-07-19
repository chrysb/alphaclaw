const fs = require("fs");

const {
  cloneRepoToTemp,
  ensureGithubRepoAccessible,
  verifyGithubRepoForOnboarding,
} = require("../../lib/server/onboarding/github");

describe("server/onboarding/github", () => {
  beforeEach(() => {
    global.fetch = vi.fn();
  });

  it("clones without embedding the github token in the command line", async () => {
    const shellCmd = vi.fn(async (cmd, opts = {}) => {
      expect(cmd).toContain('git clone --depth=1 "https://github.com/my-org/source-repo.git"');
      expect(cmd).not.toContain("ghp_secret_token_value");
      expect(opts.env?.ALPHACLAW_GITHUB_TOKEN).toBe("ghp_secret_token_value");
      expect(typeof opts.env?.GIT_ASKPASS).toBe("string");
      expect(fs.existsSync(opts.env.GIT_ASKPASS)).toBe(true);
      return "";
    });

    const result = await cloneRepoToTemp({
      repoUrl: "my-org/source-repo",
      githubToken: "ghp_secret_token_value",
      shellCmd,
    });

    expect(result.ok).toBe(true);
    expect(shellCmd).toHaveBeenCalledTimes(1);
    const [, opts] = shellCmd.mock.calls[0];
    expect(fs.existsSync(opts.env.GIT_ASKPASS)).toBe(false);
  });

  it("allows org-owned new repos when github token verification succeeds", async () => {
    global.fetch
      .mockResolvedValueOnce({
        ok: true,
        headers: { get: () => "repo" },
        json: async () => ({ login: "tokudu" }),
      })
      .mockResolvedValueOnce({
        status: 404,
        ok: false,
        statusText: "Not Found",
        json: async () => ({ message: "Not Found" }),
      })
      .mockResolvedValueOnce({
        ok: true,
        headers: { get: () => "" },
        json: async () => [{ login: "make-stories" }],
      });

    const result = await verifyGithubRepoForOnboarding({
      repoUrl: "make-stories/new-workspace",
      githubToken: "ghp_secret_token_value",
      mode: "new",
    });

    expect(result).toEqual({
      ok: true,
      repoExists: false,
      repoIsEmpty: false,
      createOwnerType: "org",
      viewerLogin: "tokudu",
    });
  });

  it("rejects new repos when the owner is not the token user or an accessible org", async () => {
    global.fetch
      .mockResolvedValueOnce({
        ok: true,
        headers: { get: () => "repo" },
        json: async () => ({ login: "chrysbtest" }),
      })
      .mockResolvedValueOnce({
        status: 404,
        ok: false,
        statusText: "Not Found",
        json: async () => ({ message: "Not Found" }),
      })
      .mockResolvedValueOnce({
        ok: true,
        headers: { get: () => "" },
        json: async () => [],
      });

    const result = await verifyGithubRepoForOnboarding({
      repoUrl: "chrybtest/test81",
      githubToken: "ghp_secret_token_value",
      mode: "new",
    });

    expect(result.ok).toBe(false);
    expect(result.status).toBe(400);
    expect(result.error).toContain('Repository owner "chrybtest"');
    expect(result.error).toContain('authenticated GitHub user "chrysbtest"');
  });

  it("creates org-owned new repos through the organization endpoint", async () => {
    global.fetch
      .mockResolvedValueOnce({
        ok: true,
        headers: { get: () => "repo" },
        json: async () => ({ login: "tokudu" }),
      })
      .mockResolvedValueOnce({
        status: 404,
        ok: false,
        statusText: "Not Found",
        json: async () => ({ message: "Not Found" }),
      })
      .mockResolvedValueOnce({
        ok: true,
        headers: { get: () => "" },
        json: async () => [{ login: "make-stories" }],
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 201,
        statusText: "Created",
        json: async () => ({}),
      });

    const result = await ensureGithubRepoAccessible({
      repoUrl: "make-stories/new-workspace",
      repoName: "new-workspace",
      githubToken: "ghp_secret_token_value",
    });

    expect(result).toEqual({ ok: true });
    expect(global.fetch).toHaveBeenLastCalledWith(
      "https://api.github.com/orgs/make-stories/repos",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({
          name: "new-workspace",
          private: true,
          auto_init: false,
        }),
      }),
    );
  });

  it("flags a user-owned repo as already taken when listing shows a hidden match", async () => {
    global.fetch
      .mockResolvedValueOnce({
        ok: true,
        headers: { get: () => "repo" },
        json: async () => ({ login: "owner" }),
      })
      .mockResolvedValueOnce({
        status: 404,
        ok: false,
        statusText: "Not Found",
        json: async () => ({ message: "Not Found" }),
      })
      .mockResolvedValueOnce({
        ok: true,
        headers: { get: () => "" },
        json: async () => [{ name: "repo", full_name: "owner/repo" }],
      });

    const result = await verifyGithubRepoForOnboarding({
      repoUrl: "owner/repo",
      githubToken: "github_pat_hidden_repo_token",
      mode: "new",
    });

    expect(result.ok).toBe(false);
    expect(result.status).toBe(400);
    expect(result.error).toContain('Repository "owner/repo" already exists');
    expect(result.error).toContain("cannot inspect");
  });
});

describe("server/onboarding/github error branches", () => {
  beforeEach(() => {
    global.fetch = vi.fn();
  });

  const okUser = ({ login = "owner", scopes = "repo" } = {}) => ({
    ok: true,
    headers: { get: () => scopes },
    json: async () => ({ login }),
  });

  it("reports token verification failures with message and error details", async () => {
    global.fetch.mockResolvedValueOnce({
      ok: false,
      status: 401,
      statusText: "Unauthorized",
      json: async () => ({
        message: "Bad credentials",
        errors: [{ message: "token expired" }, { message: "" }, {}],
      }),
    });

    const result = await verifyGithubRepoForOnboarding({
      repoUrl: "owner/repo",
      githubToken: "ghp_bad",
    });

    expect(result).toEqual({
      ok: false,
      status: 400,
      error: "Cannot verify GitHub token: Bad credentials (token expired)",
    });
  });

  it("reports token verification failures with message only", async () => {
    global.fetch.mockResolvedValueOnce({
      ok: false,
      status: 401,
      statusText: "Unauthorized",
      json: async () => ({ message: "Bad credentials" }),
    });

    const result = await verifyGithubRepoForOnboarding({
      repoUrl: "owner/repo",
      githubToken: "ghp_bad",
    });

    expect(result.error).toBe("Cannot verify GitHub token: Bad credentials");
  });

  it("reports token verification failures with detail only", async () => {
    global.fetch.mockResolvedValueOnce({
      ok: false,
      status: 422,
      statusText: "Unprocessable",
      json: async () => ({ errors: [{ message: "just detail" }] }),
    });

    const result = await verifyGithubRepoForOnboarding({
      repoUrl: "owner/repo",
      githubToken: "ghp_bad",
    });

    expect(result.error).toBe("Cannot verify GitHub token: just detail");
  });

  it("falls back to statusText when the error payload is not json", async () => {
    global.fetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      statusText: "Server Error",
      json: async () => {
        throw new Error("not json");
      },
    });

    const result = await verifyGithubRepoForOnboarding({
      repoUrl: "owner/repo",
      githubToken: "ghp_bad",
    });

    expect(result.error).toBe("Cannot verify GitHub token: Server Error");
  });

  it("rejects classic PATs that are missing the repo scope", async () => {
    global.fetch.mockResolvedValueOnce(okUser({ scopes: "gist, notifications" }));

    const result = await verifyGithubRepoForOnboarding({
      repoUrl: "owner/repo",
      githubToken: "ghp_scoped",
    });

    expect(result.ok).toBe(false);
    expect(result.error).toBe(
      'Your token needs the "repo" scope. Current scopes: gist, notifications',
    );
  });

  it("reports missing repos for existing-mode verification", async () => {
    global.fetch
      .mockResolvedValueOnce(okUser({ login: "someone-else" }))
      .mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: "Not Found",
        json: async () => ({ message: "Not Found" }),
      });

    const result = await verifyGithubRepoForOnboarding({
      repoUrl: "owner/repo",
      githubToken: "ghp_token",
      mode: "existing",
    });

    expect(result.ok).toBe(false);
    expect(result.error).toBe(
      'Repository "owner/repo" not found. Check the repo name and token permissions.',
    );
  });

  it("rejects new repos when the viewer login cannot be determined", async () => {
    global.fetch
      .mockResolvedValueOnce({
        ok: true,
        headers: { get: () => "repo" },
        json: async () => ({}),
      })
      .mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: "Not Found",
        json: async () => ({ message: "Not Found" }),
      });

    const result = await verifyGithubRepoForOnboarding({
      repoUrl: "owner/repo",
      githubToken: "ghp_token",
      mode: "new",
    });

    expect(result.ok).toBe(false);
    expect(result.error).toBe("Cannot verify GitHub account owner for this token.");
  });

  it("surfaces org listing failures during owner verification", async () => {
    global.fetch
      .mockResolvedValueOnce(okUser({ login: "someone-else" }))
      .mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: "Not Found",
        json: async () => ({ message: "Not Found" }),
      })
      .mockResolvedValueOnce({
        ok: false,
        status: 403,
        statusText: "Forbidden",
        json: async () => ({ message: "SAML enforcement" }),
      });

    const result = await verifyGithubRepoForOnboarding({
      repoUrl: "my-org/repo",
      githubToken: "ghp_token",
      mode: "new",
    });

    expect(result.ok).toBe(false);
    expect(result.error).toContain(
      'Cannot verify organization "my-org" access: SAML enforcement',
    );
  });

  it("surfaces malformed org listing payloads during owner verification", async () => {
    global.fetch
      .mockResolvedValueOnce(okUser({ login: "someone-else" }))
      .mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: "Not Found",
        json: async () => ({ message: "Not Found" }),
      })
      .mockResolvedValueOnce({
        ok: true,
        headers: { get: () => "" },
        json: async () => ({ not: "an array" }),
      });

    const result = await verifyGithubRepoForOnboarding({
      repoUrl: "my-org/repo",
      githubToken: "ghp_token",
      mode: "new",
    });

    expect(result.ok).toBe(false);
    expect(result.error).toBe(
      'Cannot verify organization "my-org" access from GitHub response.',
    );
  });

  it("treats repos with conflicting commit listings as empty", async () => {
    global.fetch
      .mockResolvedValueOnce(okUser())
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ full_name: "owner/repo" }),
      })
      .mockResolvedValueOnce({
        ok: false,
        status: 409,
        statusText: "Conflict",
        json: async () => ({ message: "Git Repository is empty." }),
      });

    const result = await verifyGithubRepoForOnboarding({
      repoUrl: "owner/repo",
      githubToken: "ghp_token",
    });

    expect(result).toEqual({ ok: true, repoExists: true, repoIsEmpty: true });
  });

  it("treats repos containing only boilerplate files as empty", async () => {
    global.fetch
      .mockResolvedValueOnce(okUser())
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ full_name: "owner/repo" }),
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => [{ sha: "abc" }],
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => [
          { name: "README.md", type: "file" },
          { name: ".gitignore", type: "file" },
        ],
      });

    const result = await verifyGithubRepoForOnboarding({
      repoUrl: "owner/repo",
      githubToken: "ghp_token",
    });

    expect(result).toEqual({ ok: true, repoExists: true, repoIsEmpty: true });
  });

  it("reports commit verification failures for existing repos", async () => {
    global.fetch
      .mockResolvedValueOnce(okUser())
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ full_name: "owner/repo" }),
      })
      .mockResolvedValueOnce({
        ok: false,
        status: 451,
        statusText: "Blocked",
        json: async () => ({ message: "Repository access blocked" }),
      });

    const result = await verifyGithubRepoForOnboarding({
      repoUrl: "owner/repo",
      githubToken: "ghp_token",
    });

    expect(result.ok).toBe(false);
    expect(result.error).toBe(
      'Cannot verify whether repo "owner/repo" is empty: Repository access blocked',
    );
  });

  it("explains fine-grained token permission failures on repo checks", async () => {
    global.fetch
      .mockResolvedValueOnce({
        ok: true,
        headers: { get: () => "" },
        json: async () => ({ login: "owner" }),
      })
      .mockResolvedValueOnce({
        ok: false,
        status: 403,
        statusText: "Forbidden",
        json: async () => ({ message: "Resource not accessible" }),
      });

    const result = await verifyGithubRepoForOnboarding({
      repoUrl: "owner/repo",
      githubToken: "github_pat_fine_grained",
    });

    expect(result.ok).toBe(false);
    expect(result.error).toBe(
      'Your fine-grained token needs Contents (read/write) and Metadata (read) permissions for "owner/repo".',
    );
  });

  it("reports generic repo verification failures", async () => {
    global.fetch
      .mockResolvedValueOnce(okUser())
      .mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: "Server Error",
        json: async () => ({ message: "boom" }),
      });

    const result = await verifyGithubRepoForOnboarding({
      repoUrl: "owner/repo",
      githubToken: "ghp_token",
    });

    expect(result.ok).toBe(false);
    expect(result.error).toBe('Cannot verify repo "owner/repo": boom');
  });

  it("uses an existing empty repo without creating a new one", async () => {
    global.fetch
      .mockResolvedValueOnce(okUser())
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ full_name: "owner/repo" }),
      })
      .mockResolvedValueOnce({
        ok: false,
        status: 409,
        statusText: "Conflict",
        json: async () => ({ message: "Git Repository is empty." }),
      });

    const result = await ensureGithubRepoAccessible({
      repoUrl: "owner/repo",
      repoName: "repo",
      githubToken: "ghp_token",
    });

    expect(result).toEqual({ ok: true });
    expect(global.fetch).toHaveBeenCalledTimes(3);
  });

  it("maps duplicate-name creation failures to a repo-exists error", async () => {
    global.fetch
      .mockResolvedValueOnce(okUser())
      .mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: "Not Found",
        json: async () => ({ message: "Not Found" }),
      })
      .mockResolvedValueOnce({
        ok: true,
        headers: { get: () => "" },
        json: async () => [],
      })
      .mockResolvedValueOnce({
        ok: false,
        status: 422,
        statusText: "Unprocessable",
        json: async () => ({
          message: "Repository creation failed.",
          errors: [{ message: "name already exists on this account" }],
        }),
      });

    const result = await ensureGithubRepoAccessible({
      repoUrl: "owner/repo",
      repoName: "repo",
      githubToken: "ghp_token",
    });

    expect(result.ok).toBe(false);
    expect(result.error).toContain('Repository "owner/repo" already exists.');
  });

  it("adds a classic PAT hint for 403 create failures", async () => {
    global.fetch
      .mockResolvedValueOnce(okUser())
      .mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: "Not Found",
        json: async () => ({ message: "Not Found" }),
      })
      .mockResolvedValueOnce({
        ok: true,
        headers: { get: () => "" },
        json: async () => [],
      })
      .mockResolvedValueOnce({
        ok: false,
        status: 403,
        statusText: "Forbidden",
        json: async () => ({ message: "Resource not accessible by integration." }),
      });

    const result = await ensureGithubRepoAccessible({
      repoUrl: "owner/repo",
      repoName: "repo",
      githubToken: "ghp_token",
    });

    expect(result.ok).toBe(false);
    expect(result.error).toContain("Failed to create repo:");
    expect(result.error).toContain('Ensure your token is a classic PAT with the "repo" scope.');
  });

  it("omits the classic PAT hint for non-permission create failures", async () => {
    global.fetch
      .mockResolvedValueOnce(okUser())
      .mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: "Not Found",
        json: async () => ({ message: "Not Found" }),
      })
      .mockResolvedValueOnce({
        ok: true,
        headers: { get: () => "" },
        json: async () => [],
      })
      .mockResolvedValueOnce({
        ok: false,
        status: 422,
        statusText: "Unprocessable",
        json: async () => ({ message: "Validation failed" }),
      });

    const result = await ensureGithubRepoAccessible({
      repoUrl: "owner/repo",
      repoName: "repo",
      githubToken: "ghp_token",
    });

    expect(result.ok).toBe(false);
    expect(result.error).toBe("Failed to create repo: Validation failed");
  });

  it("wraps unexpected create-repo exceptions", async () => {
    global.fetch
      .mockResolvedValueOnce(okUser())
      .mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: "Not Found",
        json: async () => ({ message: "Not Found" }),
      })
      .mockResolvedValueOnce({
        ok: true,
        headers: { get: () => "" },
        json: async () => [],
      })
      .mockRejectedValueOnce(new Error("socket hang up"));

    const result = await ensureGithubRepoAccessible({
      repoUrl: "owner/repo",
      repoName: "repo",
      githubToken: "ghp_token",
    });

    expect(result).toEqual({
      ok: false,
      status: 400,
      error: "GitHub error: socket hang up",
    });
  });

  it("returns a clone error when git clone fails", async () => {
    const shellCmd = vi.fn(async () => {
      throw new Error("fatal: could not read from remote");
    });

    const result = await cloneRepoToTemp({
      repoUrl: "owner/repo",
      githubToken: "ghp_token",
      shellCmd,
    });

    expect(result.ok).toBe(false);
    expect(result.error).toBe(
      "Failed to clone repo: fatal: could not read from remote",
    );
  });

  it("logs but does not throw when temp clone cleanup fails", () => {
    const os = require("os");
    const path = require("path");
    const { cleanupTempClone } = require("../../lib/server/onboarding/github");
    const tempDir = path.join(os.tmpdir(), "alphaclaw-import-cleanup-fail");
    const rmSpy = vi.spyOn(fs, "rmSync").mockImplementation(() => {
      throw new Error("EACCES: permission denied");
    });
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    expect(() => cleanupTempClone(tempDir)).not.toThrow();
    expect(rmSpy).toHaveBeenCalledWith(tempDir, { recursive: true, force: true });
    expect(errorSpy).toHaveBeenCalledWith(
      "[onboard] Temp cleanup error: EACCES: permission denied",
    );

    rmSpy.mockRestore();
    errorSpy.mockRestore();
  });
});
