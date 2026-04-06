const loadApiModule = async () => import("../../lib/public/js/lib/api.js");

const mockJsonResponse = (status, payload) => ({
  status,
  ok: status >= 200 && status < 300,
  text: async () => JSON.stringify(payload),
  json: async () => payload,
});

describe("frontend/api", () => {
  const expectLastFetchHeaders = (expectedContentType = "") => {
    const callArgs = global.fetch.mock.calls[global.fetch.mock.calls.length - 1] || [];
    const options = callArgs[1] || {};
    const headers = options.headers;
    expect(headers).toBeInstanceOf(Headers);
    if (expectedContentType) {
      expect(headers.get("Content-Type")).toBe(expectedContentType);
    }
    return { callArgs, options, headers };
  };

  beforeEach(() => {
    global.fetch = vi.fn();
    global.window = { location: { href: "http://localhost/" } };
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("fetchStatus returns parsed JSON on success", async () => {
    const payload = { gateway: "running" };
    global.fetch.mockResolvedValue(mockJsonResponse(200, payload));
    const api = await loadApiModule();

    const result = await api.fetchStatus();

    expect(global.fetch).toHaveBeenCalledWith(
      "/api/status",
      expect.objectContaining({ headers: expect.any(Headers) }),
    );
    expect(result).toEqual(payload);
    expect(window.location.href).toBe("http://localhost/");
  });

  it("redirects to /setup and throws on 401", async () => {
    global.fetch.mockResolvedValue(mockJsonResponse(401, { error: "Unauthorized" }));
    const api = await loadApiModule();

    await expect(api.fetchStatus()).rejects.toThrow("Unauthorized");
    expect(window.location.href).toBe("/setup");
  });

  it("waitForAlphaclawRestart resolves once AlphaClaw responds again", async () => {
    vi.useFakeTimers();
    global.fetch
      .mockResolvedValueOnce({ status: 503 })
      .mockResolvedValueOnce({ status: 200 });
    const api = await loadApiModule();

    const promise = api.waitForAlphaclawRestart({
      initialDelayMs: 10,
      intervalMs: 20,
      timeoutMs: 100,
    });

    await vi.runAllTimersAsync();

    await expect(promise).resolves.toEqual({ ok: true });
    expect(global.fetch).toHaveBeenNthCalledWith(
      1,
      "/api/auth/status",
      expect.objectContaining({
        cache: "no-store",
        credentials: "same-origin",
        headers: expect.any(Headers),
      }),
    );
  });

  it("waitForAlphaclawRestart times out when AlphaClaw does not come back", async () => {
    vi.useFakeTimers();
    global.fetch.mockRejectedValue(new Error("offline"));
    const api = await loadApiModule();

    const promise = api.waitForAlphaclawRestart({
      initialDelayMs: 0,
      intervalMs: 5,
      timeoutMs: 15,
    });
    const assertion = expect(promise).rejects.toThrow(
      "AlphaClaw restart is taking longer than expected",
    );

    await vi.runAllTimersAsync();
    await assertion;
  });

  it("runOnboard sends vars and modelKey payload", async () => {
    global.fetch.mockResolvedValue(mockJsonResponse(200, { ok: true }));
    const api = await loadApiModule();
    const vars = [{ key: "OPENAI_API_KEY", value: "sk-123" }];
    const modelKey = "openai/gpt-5.1-codex";

    const result = await api.runOnboard(vars, modelKey);

    expect(global.fetch).toHaveBeenCalledWith(
      "/api/onboard",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ vars, modelKey, importMode: false }),
        headers: expect.any(Headers),
      }),
    );
    expectLastFetchHeaders("application/json");
    expect(result).toEqual({ ok: true });
  });

  it("verifyGithubOnboardingRepo posts repo, token, and mode", async () => {
    global.fetch.mockResolvedValue(mockJsonResponse(200, { ok: true, repoExists: true }));
    const api = await loadApiModule();

    const result = await api.verifyGithubOnboardingRepo(
      "my-org/source-repo",
      "ghp_123",
      "existing",
    );

    expect(global.fetch).toHaveBeenCalledWith(
      "/api/onboard/github/verify",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({
          repo: "my-org/source-repo",
          token: "ghp_123",
          mode: "existing",
        }),
        headers: expect.any(Headers),
      }),
    );
    expectLastFetchHeaders("application/json");
    expect(result).toEqual({ ok: true, repoExists: true });
  });

  it("scanImportRepo posts the temp dir payload", async () => {
    global.fetch.mockResolvedValue(mockJsonResponse(200, { ok: true, hasOpenclawSetup: true }));
    const api = await loadApiModule();

    const result = await api.scanImportRepo("/tmp/alphaclaw-import-1234");

    expect(global.fetch).toHaveBeenCalledWith(
      "/api/onboard/import/scan",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ tempDir: "/tmp/alphaclaw-import-1234" }),
        headers: expect.any(Headers),
      }),
    );
    expectLastFetchHeaders("application/json");
    expect(result).toEqual({ ok: true, hasOpenclawSetup: true });
  });

  it("applyImport posts import approval payload", async () => {
    global.fetch.mockResolvedValue(
      mockJsonResponse(200, {
        ok: true,
        envVarsImported: 2,
        placeholderReview: {
          found: true,
          count: 1,
          vars: [{ key: "SLACK_BOT_TOKEN", status: "missing" }],
        },
      }),
    );
    const api = await loadApiModule();

    const result = await api.applyImport({
      tempDir: "/tmp/alphaclaw-import-1234",
      approvedSecrets: [{ suggestedEnvVar: "OPENAI_API_KEY", value: "sk-123" }],
      skipSecretExtraction: false,
      githubRepo: "owner/target-repo",
      githubToken: "ghp_123",
    });

    expect(global.fetch).toHaveBeenCalledWith(
      "/api/onboard/import/apply",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({
          tempDir: "/tmp/alphaclaw-import-1234",
          approvedSecrets: [{ suggestedEnvVar: "OPENAI_API_KEY", value: "sk-123" }],
          skipSecretExtraction: false,
          githubRepo: "owner/target-repo",
          githubToken: "ghp_123",
        }),
        headers: expect.any(Headers),
      }),
    );
    expectLastFetchHeaders("application/json");
    expect(result).toEqual({
      ok: true,
      envVarsImported: 2,
      placeholderReview: {
        found: true,
        count: 1,
        vars: [{ key: "SLACK_BOT_TOKEN", status: "missing" }],
      },
    });
  });

  it("saveEnvVars uses PUT with expected request body", async () => {
    global.fetch.mockResolvedValue(mockJsonResponse(200, { ok: true, changed: true }));
    const api = await loadApiModule();
    const vars = [{ key: "GITHUB_TOKEN", value: "ghp_123" }];

    const result = await api.saveEnvVars(vars);

    expect(global.fetch).toHaveBeenCalledWith(
      "/api/env",
      expect.objectContaining({
        method: "PUT",
        body: JSON.stringify({ vars }),
        headers: expect.any(Headers),
      }),
    );
    expectLastFetchHeaders("application/json");
    expect(result).toEqual({ ok: true, changed: true });
  });

  it("saveEnvVars throws server error on non-OK response", async () => {
    global.fetch.mockResolvedValue(mockJsonResponse(400, { error: "Reserved env var" }));
    const api = await loadApiModule();

    await expect(api.saveEnvVars([{ key: "PORT", value: "3000" }])).rejects.toThrow(
      "Reserved env var",
    );
  });

  it("fetchUsageSummary calls usage summary endpoint", async () => {
    global.fetch.mockResolvedValue(mockJsonResponse(200, { ok: true, summary: { daily: [] } }));
    const api = await loadApiModule();

    const result = await api.fetchUsageSummary(90);

    expect(global.fetch).toHaveBeenCalledWith(
      "/api/usage/summary?days=90",
      expect.objectContaining({ headers: expect.any(Headers) }),
    );
    expect(result).toEqual({ ok: true, summary: { daily: [] } });
  });

  it("fetchUsageSessions calls usage sessions endpoint", async () => {
    global.fetch.mockResolvedValue(mockJsonResponse(200, { ok: true, sessions: [] }));
    const api = await loadApiModule();

    const result = await api.fetchUsageSessions(100);

    expect(global.fetch).toHaveBeenCalledWith(
      "/api/usage/sessions?limit=100",
      expect.objectContaining({ headers: expect.any(Headers) }),
    );
    expect(result).toEqual({ ok: true, sessions: [] });
  });

  it("fetchDoctorStatus calls Doctor status endpoint", async () => {
    global.fetch.mockResolvedValue(mockJsonResponse(200, { ok: true, status: { stale: true } }));
    const api = await loadApiModule();

    const result = await api.fetchDoctorStatus();

    expect(global.fetch).toHaveBeenCalledWith(
      "/api/doctor/status",
      expect.objectContaining({ headers: expect.any(Headers) }),
    );
    expect(result).toEqual({ ok: true, status: { stale: true } });
  });

  it("fetchDoctorCards calls aggregated Doctor cards endpoint", async () => {
    global.fetch.mockResolvedValue(mockJsonResponse(200, { ok: true, cards: [] }));
    const api = await loadApiModule();

    const result = await api.fetchDoctorCards({ runId: "all" });

    expect(global.fetch).toHaveBeenCalledWith(
      "/api/doctor/cards?runId=all",
      expect.objectContaining({ headers: expect.any(Headers) }),
    );
    expect(result).toEqual({ ok: true, cards: [] });
  });

  it("startDoctorRun posts to the Doctor run endpoint", async () => {
    global.fetch.mockResolvedValue(mockJsonResponse(202, { ok: true, runId: 42 }));
    const api = await loadApiModule();

    const result = await api.startDoctorRun();

    expect(global.fetch).toHaveBeenCalledWith(
      "/api/doctor/run",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({}),
        headers: expect.any(Headers),
      }),
    );
    expectLastFetchHeaders("application/json");
    expect(result).toEqual({ ok: true, runId: 42 });
  });

  it("importDoctorResult posts raw Doctor output", async () => {
    global.fetch.mockResolvedValue(mockJsonResponse(201, { ok: true, runId: 43 }));
    const api = await loadApiModule();

    const result = await api.importDoctorResult('{"summary":"Imported","cards":[]}');

    expect(global.fetch).toHaveBeenCalledWith(
      "/api/doctor/import",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ rawOutput: '{"summary":"Imported","cards":[]}' }),
        headers: expect.any(Headers),
      }),
    );
    expectLastFetchHeaders("application/json");
    expect(result).toEqual({ ok: true, runId: 43 });
  });

  it("fetchUsageSessionDetail encodes session id in path", async () => {
    global.fetch.mockResolvedValue(mockJsonResponse(200, { ok: true, detail: { sessionId: "x" } }));
    const api = await loadApiModule();

    const result = await api.fetchUsageSessionDetail("agent:main:telegram:group:-1:topic:2");

    expect(global.fetch).toHaveBeenCalledWith(
      "/api/usage/sessions/agent%3Amain%3Atelegram%3Agroup%3A-1%3Atopic%3A2",
      expect.objectContaining({ headers: expect.any(Headers) }),
    );
    expect(result).toEqual({ ok: true, detail: { sessionId: "x" } });
  });

  it("sendDoctorCardFix posts delivery fields", async () => {
    global.fetch.mockResolvedValue(mockJsonResponse(200, { ok: true, stdout: "sent" }));
    const api = await loadApiModule();

    const result = await api.sendDoctorCardFix({
      cardId: 7,
      sessionId: "session-123",
      replyChannel: "telegram",
      replyTo: "1050",
      prompt: "Use a more focused fix request",
    });

    expect(global.fetch).toHaveBeenCalledWith(
      "/api/doctor/findings/7/fix",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({
          sessionId: "session-123",
          replyChannel: "telegram",
          replyTo: "1050",
          prompt: "Use a more focused fix request",
        }),
        headers: expect.any(Headers),
      }),
    );
    expectLastFetchHeaders("application/json");
    expect(result).toEqual({ ok: true, stdout: "sent" });
  });

  it("createWebhook posts optional destination fields", async () => {
    global.fetch.mockResolvedValue(mockJsonResponse(201, { ok: true, webhook: { name: "gmail" } }));
    const api = await loadApiModule();

    const result = await api.createWebhook("gmail-alerts", {
      destination: {
        channel: "telegram",
        to: "-1003709908795:4011",
      },
    });

    expect(global.fetch).toHaveBeenCalledWith(
      "/api/webhooks",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({
          name: "gmail-alerts",
          destination: {
            channel: "telegram",
            to: "-1003709908795:4011",
          },
          oauthCallback: false,
        }),
        headers: expect.any(Headers),
      }),
    );
    expectLastFetchHeaders("application/json");
    expect(result).toEqual({ ok: true, webhook: { name: "gmail" } });
  });

  it("updateWebhookDestination puts destination fields", async () => {
    global.fetch.mockResolvedValue(mockJsonResponse(200, { ok: true, webhook: { name: "gmail-alerts" } }));
    const api = await loadApiModule();

    const result = await api.updateWebhookDestination("gmail-alerts", {
      destination: {
        channel: "telegram",
        to: "1050",
        agentId: "main",
      },
    });

    expect(global.fetch).toHaveBeenCalledWith(
      "/api/webhooks/gmail-alerts/destination",
      expect.objectContaining({
        method: "PUT",
        body: JSON.stringify({
          destination: {
            channel: "telegram",
            to: "1050",
            agentId: "main",
          },
        }),
        headers: expect.any(Headers),
      }),
    );
    expectLastFetchHeaders("application/json");
    expect(result).toEqual({ ok: true, webhook: { name: "gmail-alerts" } });
  });

  it("startGmailWatch posts optional destination fields", async () => {
    global.fetch.mockResolvedValue(mockJsonResponse(200, { ok: true, accountId: "acct-1" }));
    const api = await loadApiModule();

    const result = await api.startGmailWatch("acct-1", {
      destination: {
        channel: "telegram",
        to: "1050",
      },
    });

    expect(global.fetch).toHaveBeenCalledWith(
      "/api/gmail/watch/start",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({
          accountId: "acct-1",
          destination: {
            channel: "telegram",
            to: "1050",
          },
        }),
        headers: expect.any(Headers),
      }),
    );
    expectLastFetchHeaders("application/json");
    expect(result).toEqual({ ok: true, accountId: "acct-1" });
  });

  it("syncBrowseChanges posts commit message", async () => {
    global.fetch.mockResolvedValue(mockJsonResponse(200, { ok: true, committed: true }));
    const api = await loadApiModule();

    const result = await api.syncBrowseChanges("sync changes");

    expect(global.fetch).toHaveBeenCalledWith(
      "/api/browse/git-sync",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ message: "sync changes" }),
        headers: expect.any(Headers),
      }),
    );
    expectLastFetchHeaders("application/json");
    expect(result).toEqual({ ok: true, committed: true });
  });

  it("fetchBrowseFileDiff calls git diff endpoint with encoded path", async () => {
    global.fetch.mockResolvedValue(mockJsonResponse(200, { ok: true, content: "diff --git" }));
    const api = await loadApiModule();

    const result = await api.fetchBrowseFileDiff("workspace/hooks/bootstrap/AGENTS.md");

    expect(global.fetch).toHaveBeenCalledWith(
      "/api/browse/git-diff?path=workspace%2Fhooks%2Fbootstrap%2FAGENTS.md",
      expect.objectContaining({ headers: expect.any(Headers) }),
    );
    expect(result).toEqual({ ok: true, content: "diff --git" });
  });

  it("downloadBrowseFile calls download endpoint and triggers browser download", async () => {
    const fileBlob = new Blob(["test"], { type: "text/plain" });
    const createObjectURL = vi.fn(() => "blob:test-url");
    const revokeObjectURL = vi.fn();
    global.window.URL = { createObjectURL, revokeObjectURL };
    const click = vi.fn();
    const remove = vi.fn();
    const appendChild = vi.fn();
    global.document = {
      createElement: vi.fn((tagName) =>
        tagName === "a"
          ? {
              href: "",
              download: "",
              click,
              remove,
            }
          : {},
      ),
      body: { appendChild },
    };
    global.fetch.mockResolvedValue({
      status: 200,
      ok: true,
      blob: async () => fileBlob,
      text: async () => "",
    });
    const api = await loadApiModule();

    const result = await api.downloadBrowseFile("workspace/file.txt");

    expect(global.fetch).toHaveBeenCalledWith(
      "/api/browse/download?path=workspace%2Ffile.txt",
      expect.objectContaining({ headers: expect.any(Headers) }),
    );
    expect(createObjectURL).toHaveBeenCalledWith(fileBlob);
    expect(appendChild).toHaveBeenCalledTimes(1);
    expect(click).toHaveBeenCalledTimes(1);
    expect(remove).toHaveBeenCalledTimes(1);
    expect(revokeObjectURL).toHaveBeenCalledWith("blob:test-url");
    expect(result).toEqual({ ok: true });
  });

  it("createChannelAccount posts provider, token, and agent binding fields", async () => {
    global.fetch.mockResolvedValue(
      mockJsonResponse(201, {
        ok: true,
        channel: "telegram",
        account: { id: "alerts", envKey: "TELEGRAM_BOT_TOKEN_ALERTS" },
      }),
    );
    const api = await loadApiModule();

    const result = await api.createChannelAccount({
      provider: "telegram",
      name: "Alerts",
      accountId: "alerts",
      token: "123:abc",
      agentId: "ops",
    });

    expect(global.fetch).toHaveBeenCalledWith(
      "/api/channels/accounts",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({
          provider: "telegram",
          name: "Alerts",
          accountId: "alerts",
          token: "123:abc",
          agentId: "ops",
        }),
        headers: expect.any(Headers),
      }),
    );
    expectLastFetchHeaders("application/json");
    expect(result).toEqual({
      ok: true,
      channel: "telegram",
      account: { id: "alerts", envKey: "TELEGRAM_BOT_TOKEN_ALERTS" },
    });
  });

  it("updateChannelAccount posts editable channel fields", async () => {
    global.fetch.mockResolvedValue(
      mockJsonResponse(200, {
        ok: true,
        channel: "telegram",
        account: { id: "alerts", name: "Alerts Bot", boundAgentId: "main" },
      }),
    );
    const api = await loadApiModule();

    const result = await api.updateChannelAccount({
      provider: "telegram",
      accountId: "alerts",
      name: "Alerts Bot",
      agentId: "main",
    });

    expect(global.fetch).toHaveBeenCalledWith(
      "/api/channels/accounts",
      expect.objectContaining({
        method: "PUT",
        body: JSON.stringify({
          provider: "telegram",
          accountId: "alerts",
          name: "Alerts Bot",
          agentId: "main",
        }),
        headers: expect.any(Headers),
      }),
    );
    expectLastFetchHeaders("application/json");
    expect(result).toEqual({
      ok: true,
      channel: "telegram",
      account: { id: "alerts", name: "Alerts Bot", boundAgentId: "main" },
    });
  });

  it("deleteChannelAccount sends provider and account id", async () => {
    global.fetch.mockResolvedValue(mockJsonResponse(200, { ok: true }));
    const api = await loadApiModule();

    const result = await api.deleteChannelAccount({
      provider: "telegram",
      accountId: "alerts",
    });

    expect(global.fetch).toHaveBeenCalledWith(
      "/api/channels/accounts",
      expect.objectContaining({
        method: "DELETE",
        body: JSON.stringify({
          provider: "telegram",
          accountId: "alerts",
        }),
        headers: expect.any(Headers),
      }),
    );
    expectLastFetchHeaders("application/json");
    expect(result).toEqual({ ok: true });
  });
});
