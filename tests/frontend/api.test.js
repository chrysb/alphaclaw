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

  it("fetchOnboardProgress returns the current onboarding milestone", async () => {
    const payload = {
      active: true,
      stage: "running_openclaw_onboard",
      message: "Running openclaw onboard...",
    };
    global.fetch.mockResolvedValue(mockJsonResponse(200, payload));
    const api = await loadApiModule();

    const result = await api.fetchOnboardProgress();

    expect(global.fetch).toHaveBeenCalledWith(
      "/api/onboard/progress",
      expect.objectContaining({ headers: expect.any(Headers) }),
    );
    expect(result).toEqual(payload);
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

  it("approveDevice encodes ids and throws API errors", async () => {
    global.fetch.mockResolvedValue(mockJsonResponse(403, { ok: false, error: "missing scope" }));
    const api = await loadApiModule();

    await expect(api.approveDevice("req/admin 1")).rejects.toThrow("missing scope");

    expect(global.fetch).toHaveBeenCalledWith(
      "/api/devices/req%2Fadmin%201/approve",
      expect.objectContaining({
        method: "POST",
        headers: expect.any(Headers),
      }),
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
      sessionKey: "agent:main:telegram:direct:1050",
      replyChannel: "telegram",
      replyTo: "1050",
      prompt: "Use a more focused fix request",
    });

    expect(global.fetch).toHaveBeenCalledWith(
      "/api/doctor/findings/7/fix",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({
          sessionKey: "agent:main:telegram:direct:1050",
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

  it("fetchBrowseTree defaults to a bounded tree depth", async () => {
    global.fetch.mockResolvedValue(mockJsonResponse(200, { ok: true, tree: [] }));
    const api = await loadApiModule();

    const result = await api.fetchBrowseTree();

    expect(global.fetch).toHaveBeenCalledWith(
      "/api/browse/tree?depth=3",
      expect.objectContaining({ headers: expect.any(Headers) }),
    );
    expect(result).toEqual({ ok: true, tree: [] });
  });

  it("fetchBrowseTree requests a folder subtree by path", async () => {
    global.fetch.mockResolvedValue(mockJsonResponse(200, { ok: true, root: {} }));
    const api = await loadApiModule();

    const result = await api.fetchBrowseTree({
      path: "workspace/hooks/bootstrap",
    });

    expect(global.fetch).toHaveBeenCalledWith(
      "/api/browse/tree?depth=3&path=workspace%2Fhooks%2Fbootstrap",
      expect.objectContaining({ headers: expect.any(Headers) }),
    );
    expect(result).toEqual({ ok: true, root: {} });
  });

  it("fetchBrowseTree preserves numeric depth calls", async () => {
    global.fetch.mockResolvedValue(mockJsonResponse(200, { ok: true, root: {} }));
    const api = await loadApiModule();

    const result = await api.fetchBrowseTree(2);

    expect(global.fetch).toHaveBeenCalledWith(
      "/api/browse/tree?depth=2",
      expect.objectContaining({ headers: expect.any(Headers) }),
    );
    expect(result).toEqual({ ok: true, root: {} });
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

const mockTextResponse = (status, text) => ({
  status,
  ok: status >= 200 && status < 300,
  text: async () => text,
});

class FakeEventSource {
  static instances = [];

  constructor(url, options) {
    this.url = url;
    this.options = options;
    this.listeners = new Map();
    this.closed = false;
    this.onopen = undefined;
    this.onerror = undefined;
    FakeEventSource.instances.push(this);
  }

  addEventListener(type, handler) {
    const handlers = this.listeners.get(type) || [];
    handlers.push(handler);
    this.listeners.set(type, handlers);
  }

  removeEventListener(type, handler) {
    const handlers = (this.listeners.get(type) || []).filter(
      (entry) => entry !== handler,
    );
    this.listeners.set(type, handlers);
  }

  close() {
    this.closed = true;
  }

  emit(type, event = {}) {
    for (const handler of this.listeners.get(type) || []) handler(event);
  }
}

describe("frontend/api endpoint wrapper coverage", () => {
  beforeEach(() => {
    global.fetch = vi.fn().mockResolvedValue(mockJsonResponse(200, { ok: true }));
    global.window = { location: { href: "http://localhost/" } };
  });

  afterEach(() => {
    delete global.fetch;
    delete global.window;
  });

  const kWrapperCases = [
    ["fetchPairings", [], "/api/pairings", undefined],
    ["approvePairing", ["p1", "telegram", "acct"], "/api/pairings/p1/approve", "POST"],
    ["rejectPairing", ["p1", "telegram"], "/api/pairings/p1/reject", "POST"],
    ["fetchGoogleAccounts", [], "/api/google/accounts", undefined],
    ["fetchGoogleStatus", [], "/api/google/status", undefined],
    ["fetchGoogleStatus", ["acct-1"], "/api/google/status?accountId=acct-1", undefined],
    ["fetchGoogleCredentials", [], "/api/google/credentials", undefined],
    [
      "fetchGoogleCredentials",
      [{ accountId: "a", client: "gmail" }],
      "/api/google/credentials?accountId=a&client=gmail",
      undefined,
    ],
    ["checkGoogleApis", ["a"], "/api/google/check?accountId=a", undefined],
    [
      "saveGoogleCredentials",
      [{ clientId: "id", clientSecret: "sec", email: "e@x.com" }],
      "/api/google/credentials",
      "POST",
    ],
    ["saveGoogleAccount", [{ email: "e@x.com" }], "/api/google/accounts", "POST"],
    ["disconnectGoogle", ["a"], "/api/google/disconnect", "POST"],
    ["fetchGmailConfig", [], "/api/gmail/config", undefined],
    ["saveGmailConfig", [], "/api/gmail/config", "POST"],
    ["startGmailWatch", ["acct"], "/api/gmail/watch/start", "POST"],
    ["stopGmailWatch", ["acct"], "/api/gmail/watch/stop", "POST"],
    ["renewGmailWatch", [], "/api/gmail/watch/renew", "POST"],
    ["fetchAgentSessions", [], "/api/agent/sessions", undefined],
    ["fetchDoctorRuns", [5], "/api/doctor/runs?limit=5", undefined],
    ["fetchDoctorCards", [{ runId: "" }], "/api/doctor/cards", undefined],
    ["fetchDoctorRun", ["r1"], "/api/doctor/runs/r1", undefined],
    ["fetchDoctorRunCards", ["r1"], "/api/doctor/runs/r1/cards", undefined],
    [
      "updateDoctorCardStatus",
      [{ cardId: "c1", status: "resolved" }],
      "/api/doctor/cards/c1/status",
      "POST",
    ],
    ["sendAgentMessage", [{ message: "hi", sessionKey: "k" }], "/api/agent/message", "POST"],
    ["sendAgentMessage", [], "/api/agent/message", "POST"],
    ["sendDoctorCardFix", [], "/api/doctor/findings//fix", "POST"],
    ["restartGateway", [], "/api/gateway/restart", "POST"],
    ["fetchRestartStatus", [], "/api/restart-status", undefined],
    ["dismissRestartStatus", [], "/api/restart-status/dismiss", "POST"],
    ["fetchWatchdogStatus", [], "/api/watchdog/status", undefined],
    ["fetchUsageSummary", [], "/api/usage/summary?days=30", undefined],
    ["fetchUsageSessions", [], "/api/usage/sessions?limit=50", undefined],
    [
      "fetchUsageSessionTimeSeries",
      ["s1", 50],
      "/api/usage/sessions/s1/timeseries?maxPoints=50",
      undefined,
    ],
    ["fetchWatchdogEvents", [], "/api/watchdog/events?limit=20", undefined],
    ["createWatchdogTerminalSession", [], "/api/watchdog/terminal/session", "POST"],
    [
      "fetchWatchdogTerminalOutput",
      ["s1", 5],
      "/api/watchdog/terminal/output?sessionId=s1&cursor=5",
      undefined,
    ],
    [
      "fetchWatchdogTerminalOutput",
      ["s1"],
      "/api/watchdog/terminal/output?sessionId=s1&cursor=0",
      undefined,
    ],
    ["sendWatchdogTerminalInput", ["s1", "ls"], "/api/watchdog/terminal/input", "POST"],
    ["closeWatchdogTerminalSession", ["s1"], "/api/watchdog/terminal/close", "POST"],
    ["triggerWatchdogRepair", [], "/api/watchdog/repair", "POST"],
    ["fetchWatchdogResources", [], "/api/watchdog/resources", undefined],
    ["fetchWatchdogSettings", [], "/api/watchdog/settings", undefined],
    ["updateWatchdogSettings", [{ enabled: true }], "/api/watchdog/settings", "PUT"],
    ["updateWatchdogSettings", [null], "/api/watchdog/settings", "PUT"],
    ["fetchDashboardUrl", [], "/api/gateway/dashboard", undefined],
    ["fetchAlphaclawVersion", [], "/api/alphaclaw/version", undefined],
    ["fetchAlphaclawVersion", [true], "/api/alphaclaw/version?refresh=1", undefined],
    ["updateAlphaclaw", [], "/api/alphaclaw/update", "POST"],
    ["fetchSyncCron", [], "/api/sync-cron", undefined],
    ["updateSyncCron", [{ schedule: "0 0 * * *" }], "/api/sync-cron", "PUT"],
    [
      "updateOpenAiCompatApiFeature",
      [true],
      "/api/alphaclaw/config/features/openai-compat-api",
      "PUT",
    ],
    ["fetchCronJobs", [], "/api/cron/jobs?sortBy=nextRunAtMs&sortDir=asc", undefined],
    ["fetchCronJobs", [{ sortBy: "", sortDir: "" }], "/api/cron/jobs", undefined],
    ["fetchCronStatus", [], "/api/cron/status", undefined],
    [
      "fetchCronJobRuns",
      ["j1"],
      "/api/cron/jobs/j1/runs?limit=20&offset=0&status=all&deliveryStatus=all&sortDir=desc",
      undefined,
    ],
    [
      "fetchCronJobRuns",
      ["j1", { query: " find me " }],
      "/api/cron/jobs/j1/runs?limit=20&offset=0&status=all&deliveryStatus=all&sortDir=desc&query=find+me",
      undefined,
    ],
    ["fetchCronJobUsage", ["j1"], "/api/cron/jobs/j1/usage?days=30", undefined],
    ["fetchCronJobTrends", ["j1"], "/api/cron/jobs/j1/trends?range=7d", undefined],
    ["fetchCronBulkUsage", [], "/api/cron/usage/bulk?days=30", undefined],
    [
      "fetchCronBulkRuns",
      [],
      "/api/cron/runs/bulk?sinceMs=0&limitPerJob=20&status=all&deliveryStatus=all&sortDir=desc",
      undefined,
    ],
    ["triggerCronJobRun", ["j1"], "/api/cron/jobs/j1/run", "POST"],
    ["setCronJobEnabled", ["j1", true], "/api/cron/jobs/j1/enable", "POST"],
    ["setCronJobEnabled", ["j1", false], "/api/cron/jobs/j1/disable", "POST"],
    ["updateCronJobPrompt", ["j1", "new prompt"], "/api/cron/jobs/j1/prompt", "PUT"],
    ["updateCronJobRouting", ["j1"], "/api/cron/jobs/j1/routing", "PUT"],
    ["fetchDevicePairings", [], "/api/devices", undefined],
    ["rejectDevice", ["d1"], "/api/devices/d1/reject", "POST"],
    ["fetchNodesStatus", [], "/api/nodes", undefined],
    ["approveNode", ["n1"], "/api/nodes/n1/approve", "POST"],
    ["removeNode", ["n1"], "/api/nodes/n1", "DELETE"],
    ["routeExecToNode", ["n1"], "/api/nodes/n1/route", "POST"],
    ["fetchNodeConnectInfo", [], "/api/nodes/connect-info", undefined],
    [
      "fetchNodeBrowserStatusForNode",
      ["n1"],
      "/api/nodes/n1/browser-status?profile=user",
      undefined,
    ],
    ["fetchNodeExecConfig", [], "/api/nodes/exec-config", undefined],
    ["saveNodeExecConfig", [{ security: "allowlist" }], "/api/nodes/exec-config", "POST"],
    ["fetchNodeExecApprovals", [], "/api/nodes/exec-approvals", undefined],
    [
      "addNodeExecAllowlistPattern",
      ["npm run *"],
      "/api/nodes/exec-approvals/allowlist",
      "POST",
    ],
    [
      "removeNodeExecAllowlistPattern",
      ["e1"],
      "/api/nodes/exec-approvals/allowlist/e1",
      "DELETE",
    ],
    ["fetchAuthStatus", [], "/api/auth/status", undefined],
    ["logout", [], "/api/auth/logout", "POST"],
    ["fetchOnboardStatus", [], "/api/onboard/status", undefined],
    ["fetchModels", [], "/api/models", undefined],
    ["fetchModelStatus", [], "/api/models/status", undefined],
    [
      "fetchThinkingOptions",
      ["anthropic/claude"],
      "/api/models/thinking-options?modelKey=anthropic%2Fclaude",
      undefined,
    ],
    ["setPrimaryModel", ["k1"], "/api/models/set", "POST"],
    ["fetchModelsConfig", [], "/api/models/config", undefined],
    ["fetchModelsConfig", [{ agentId: "a1" }], "/api/models/config?agentId=a1", undefined],
    ["saveModelsConfig", [], "/api/models/config", "PUT"],
    [
      "saveModelsConfig",
      [{ agentId: "a1", primary: "k" }],
      "/api/models/config?agentId=a1",
      "PUT",
    ],
    ["fetchAuthProfiles", [], "/api/models/auth", undefined],
    ["upsertAuthProfile", ["p1", { apiKey: "sk" }], "/api/models/auth/p1", "PUT"],
    ["deleteAuthProfile", ["p1"], "/api/models/auth/p1", "DELETE"],
    ["fetchAgents", [], "/api/agents", undefined],
    ["fetchChannelAccounts", [], "/api/channels/accounts", undefined],
    [
      "fetchChannelAccountToken",
      [{ provider: "telegram" }],
      "/api/channels/accounts/token?provider=telegram&accountId=default",
      undefined,
    ],
    [
      "fetchChannelAccountToken",
      [],
      "/api/channels/accounts/token?provider=&accountId=default",
      undefined,
    ],
    ["createChannelAccountJob", [{ provider: "telegram" }], "/api/channels/accounts/jobs", "POST"],
    ["runChannelAccountLogin", [{ provider: "whatsapp" }], "/api/channels/accounts/login", "POST"],
    [
      "fetchChannelAccountLoginStatus",
      [{ provider: "whatsapp" }],
      "/api/channels/accounts/login-status?provider=whatsapp&accountId=default",
      undefined,
    ],
    [
      "fetchChannelAccountLoginStatus",
      [],
      "/api/channels/accounts/login-status?provider=&accountId=default",
      undefined,
    ],
    ["fetchAgent", ["a1"], "/api/agents/a1", undefined],
    ["fetchAgentWorkspaceSize", ["a1"], "/api/agents/a1/workspace-size", undefined],
    ["fetchAgentBindings", ["a1"], "/api/agents/a1/bindings", undefined],
    ["createAgent", [{ name: "Ops" }], "/api/agents", "POST"],
    ["updateAgent", ["a1", { name: "Ops" }], "/api/agents/a1", "PUT"],
    ["addAgentBinding", ["a1", { channel: "telegram" }], "/api/agents/a1/bindings", "POST"],
    ["removeAgentBinding", ["a1", { channel: "telegram" }], "/api/agents/a1/bindings", "DELETE"],
    ["deleteAgent", ["a1"], "/api/agents/a1?keepWorkspace=true", "DELETE"],
    [
      "deleteAgent",
      ["a1", { keepWorkspace: false }],
      "/api/agents/a1?keepWorkspace=false",
      "DELETE",
    ],
    ["setDefaultAgent", ["a1"], "/api/agents/a1/default", "POST"],
    ["fetchCodexStatus", [], "/api/codex/status", undefined],
    ["disconnectCodex", [], "/api/codex/disconnect", "POST"],
    ["exchangeCodexOAuth", ["code-1"], "/api/codex/exchange", "POST"],
    ["fetchEnvVars", [], "/api/env", undefined],
    ["saveEnvVars", [[{ key: "A", value: "1" }]], "/api/env", "PUT"],
    ["fetchWebhooks", [], "/api/webhooks", undefined],
    ["fetchWebhookDetail", ["hook"], "/api/webhooks/hook", undefined],
    ["createWebhook", ["hook"], "/api/webhooks", "POST"],
    ["deleteWebhook", ["hook"], "/api/webhooks/hook", "DELETE"],
    ["updateWebhookDestination", ["hook"], "/api/webhooks/hook/destination", "PUT"],
    ["createWebhookOauthCallback", ["hook"], "/api/webhooks/hook/oauth-callback", "POST"],
    ["rotateWebhookOauthCallback", ["hook"], "/api/webhooks/hook/oauth-callback/rotate", "POST"],
    ["deleteWebhookOauthCallback", ["hook"], "/api/webhooks/hook/oauth-callback", "DELETE"],
    [
      "fetchWebhookRequests",
      ["hook"],
      "/api/webhooks/hook/requests?limit=50&offset=0&status=all",
      undefined,
    ],
    ["fetchWebhookRequest", ["hook", 3], "/api/webhooks/hook/requests/3", undefined],
    ["fetchFileContent", ["notes/a.txt"], "/api/browse/read?path=notes%2Fa.txt", undefined],
    ["saveFileContent", ["notes/a.txt", "hello"], "/api/browse/write", "PUT"],
    ["saveFileContent", ["notes/a.txt", null], "/api/browse/write", "PUT"],
    ["createBrowseFile", ["notes/new.txt"], "/api/browse/create-file", "POST"],
    ["createBrowseFolder", ["notes/dir"], "/api/browse/create-folder", "POST"],
    ["moveBrowsePath", ["a.txt", "b.txt"], "/api/browse/move", "POST"],
    ["deleteBrowseFile", ["a.txt"], "/api/browse/delete", "DELETE"],
    ["restoreBrowseFile", ["a.txt"], "/api/browse/restore", "POST"],
    ["fetchBrowseGitSummary", [], "/api/browse/git-summary", undefined],
    [
      "fetchBrowseSqliteTable",
      [{ filePath: "db.sqlite", table: "runs" }],
      "/api/browse/sqlite-table?path=db.sqlite&table=runs&limit=50&offset=0",
      undefined,
    ],
  ];

  it.each(kWrapperCases)(
    "%s requests %s",
    async (name, args, expectedUrl, method) => {
      const api = await loadApiModule();

      const result = await api[name](...args);

      const [calledUrl, options = {}] = global.fetch.mock.calls[0];
      expect(calledUrl).toBe(expectedUrl);
      expect(options.method).toBe(method);
      expect(options.headers).toBeInstanceOf(Headers);
      expect(result).toEqual({ ok: true });
    },
  );
});

describe("frontend/api behaviors", () => {
  const kRealIntl = global.Intl;

  beforeEach(() => {
    global.fetch = vi.fn().mockResolvedValue(mockJsonResponse(200, { ok: true }));
    global.window = { location: { href: "http://localhost/" } };
    FakeEventSource.instances = [];
  });

  afterEach(() => {
    global.Intl = kRealIntl;
    delete global.fetch;
    delete global.window;
    delete global.document;
  });

  it("authFetch attaches the browser timezone header", async () => {
    const api = await loadApiModule();

    const res = await api.authFetch("/api/ping");

    expect(res.status).toBe(200);
    const headers = global.fetch.mock.calls[0][1].headers;
    expect(headers.get("x-client-timezone")).toBe(
      new Intl.DateTimeFormat().resolvedOptions().timeZone,
    );
  });

  it("authFetch keeps a caller-provided timezone header", async () => {
    const api = await loadApiModule();

    await api.authFetch("/api/ping", {
      headers: { "x-client-timezone": "UTC" },
    });

    const headers = global.fetch.mock.calls[0][1].headers;
    expect(headers.get("x-client-timezone")).toBe("UTC");
  });

  it("authFetch omits the timezone header when Intl lookup throws", async () => {
    global.Intl = {
      DateTimeFormat: () => {
        throw new Error("boom");
      },
    };
    const api = await loadApiModule();

    await api.authFetch("/api/ping");

    const headers = global.fetch.mock.calls[0][1].headers;
    expect(headers.get("x-client-timezone")).toBe(null);
  });

  it("authFetch omits the timezone header when timezone is empty", async () => {
    global.Intl = {
      DateTimeFormat: () => ({ resolvedOptions: () => ({ timeZone: "" }) }),
    };
    const api = await loadApiModule();

    await api.authFetch("/api/ping");

    const headers = global.fetch.mock.calls[0][1].headers;
    expect(headers.get("x-client-timezone")).toBe(null);
  });

  it("still redirects on 401 when localStorage.clear throws", async () => {
    global.window.localStorage = {
      clear: () => {
        throw new Error("denied");
      },
    };
    global.fetch.mockResolvedValue(mockJsonResponse(401, {}));
    const api = await loadApiModule();

    await expect(api.fetchStatus()).rejects.toThrow("Unauthorized");
    expect(window.location.href).toBe("/setup");
  });

  it("subscribeStatusEvents throws when EventSource is unavailable", async () => {
    const api = await loadApiModule();

    expect(() => api.subscribeStatusEvents()).toThrow(
      "Server events are not supported in this browser",
    );
  });

  it("subscribeStatusEvents wires status events and unsubscribes", async () => {
    global.window.EventSource = FakeEventSource;
    const api = await loadApiModule();
    const events = [];
    const onOpen = vi.fn();
    const onError = vi.fn();

    const unsubscribe = api.subscribeStatusEvents({
      onMessage: (payload) => events.push(payload),
      onOpen,
      onError,
    });

    const source = FakeEventSource.instances[0];
    expect(source.url).toBe("/api/events/status");
    expect(source.options).toEqual({ withCredentials: true });

    source.emit("status", { data: JSON.stringify({ gateway: "running" }) });
    source.emit("status", { data: "not json" });
    source.emit("status", { data: "null" });
    source.emit("status", {});
    source.onopen();
    source.onerror("err");

    expect(events).toEqual([{ gateway: "running" }, {}, {}, {}]);
    expect(onOpen).toHaveBeenCalledTimes(1);
    expect(onError).toHaveBeenCalledWith("err");

    unsubscribe();
    expect(source.closed).toBe(true);
    expect(source.onopen).toBe(null);
    expect(source.onerror).toBe(null);
    source.emit("status", { data: "{}" });
    expect(events).toHaveLength(4);
  });

  it("subscribeStatusEvents defaults its callbacks to no-ops", async () => {
    global.window.EventSource = FakeEventSource;
    const api = await loadApiModule();

    const unsubscribe = api.subscribeStatusEvents({});

    const source = FakeEventSource.instances[0];
    expect(() => {
      source.emit("status", { data: "{}" });
      source.onopen();
      source.onerror("err");
    }).not.toThrow();
    unsubscribe();
  });

  it("subscribeOperationEvents subscribes to the operation SSE stream", async () => {
    global.window.EventSource = FakeEventSource;
    const api = await loadApiModule();
    const messages = [];

    const unsubscribe = api.subscribeOperationEvents({
      operationId: "op 1",
      onMessage: (message) => messages.push(message),
    });

    const source = FakeEventSource.instances[0];
    expect(source.url).toBe("/api/operations/op%201/events");
    source.emit("phase", { data: JSON.stringify({ phase: "start" }) });
    expect(messages).toEqual([{ event: "phase", data: { phase: "start" } }]);
    unsubscribe();
    expect(source.closed).toBe(true);
  });

  it("parseJsonOrThrow rejects when the payload marks ok false", async () => {
    global.fetch.mockResolvedValue(mockJsonResponse(200, { ok: false, error: "nope" }));
    const api = await loadApiModule();

    await expect(api.rejectPairing("p1", "telegram")).rejects.toThrow("nope");
  });

  it("parseJsonOrThrow resolves an empty body to an empty object", async () => {
    global.fetch.mockResolvedValue(mockTextResponse(200, ""));
    const api = await loadApiModule();

    await expect(api.rejectPairing("p1", "telegram")).resolves.toEqual({});
  });

  it("parseJsonOrThrow rejects with raw text for invalid JSON", async () => {
    global.fetch.mockResolvedValue(mockTextResponse(200, "garbage"));
    const api = await loadApiModule();

    await expect(api.rejectPairing("p1", "telegram")).rejects.toThrow("garbage");
  });

  it("parseJsonOrThrow falls back to HTTP status errors", async () => {
    global.fetch.mockResolvedValue(mockTextResponse(500, ""));
    const api = await loadApiModule();

    await expect(api.rejectPairing("p1", "telegram")).rejects.toThrow("HTTP 500");
  });

  it("fetchWatchdogLogs returns raw text", async () => {
    global.fetch.mockResolvedValue(mockTextResponse(200, "log text"));
    const api = await loadApiModule();

    await expect(api.fetchWatchdogLogs(1024)).resolves.toBe("log text");
    expect(global.fetch.mock.calls[0][0]).toBe("/api/watchdog/logs?tail=1024");
  });

  it("fetchWatchdogLogs throws on non-OK responses", async () => {
    global.fetch.mockResolvedValue(mockTextResponse(500, "boom"));
    const api = await loadApiModule();

    await expect(api.fetchWatchdogLogs()).rejects.toThrow(
      "Could not load watchdog logs",
    );
  });

  it("routeExecToNode maps AbortError to a timeout message", async () => {
    global.fetch.mockRejectedValue(
      Object.assign(new Error("aborted"), { name: "AbortError" }),
    );
    const api = await loadApiModule();

    await expect(api.routeExecToNode("n1")).rejects.toThrow(
      "Routing timed out. Gateway may be restarting or unavailable.",
    );
  });

  it("routeExecToNode rethrows other errors", async () => {
    global.fetch.mockRejectedValue(new Error("network down"));
    const api = await loadApiModule();

    await expect(api.routeExecToNode("n1")).rejects.toThrow("network down");
  });

  it("downloadBrowseFile throws with server error text", async () => {
    global.fetch.mockResolvedValue(mockTextResponse(404, "missing file"));
    const api = await loadApiModule();

    await expect(api.downloadBrowseFile("a.txt")).rejects.toThrow("missing file");
  });

  it("downloadBrowseFile throws when object URLs are unsupported", async () => {
    global.window.URL = { createObjectURL: null };
    global.fetch.mockResolvedValue({
      status: 200,
      ok: true,
      blob: async () => new Blob(["x"]),
      text: async () => "",
    });
    const api = await loadApiModule();

    await expect(api.downloadBrowseFile("a.txt")).rejects.toThrow(
      "Download is not supported in this browser",
    );
  });

  it("fetchAlphaclawReleaseNotes returns server release notes with a tag query", async () => {
    global.fetch.mockResolvedValue(mockJsonResponse(200, { ok: true, tag: "v1" }));
    const api = await loadApiModule();

    const result = await api.fetchAlphaclawReleaseNotes("v1");

    expect(global.fetch.mock.calls[0][0]).toBe("/api/alphaclaw/release-notes?tag=v1");
    expect(result).toEqual({ ok: true, tag: "v1" });
  });

  it("fetchAlphaclawReleaseNotes falls back to the GitHub tag endpoint", async () => {
    global.fetch
      .mockResolvedValueOnce(mockTextResponse(500, JSON.stringify({ error: "nope" })))
      .mockResolvedValueOnce(
        mockTextResponse(
          200,
          JSON.stringify({
            tag_name: "v2",
            name: "Release 2",
            body: "Notes",
            html_url: "https://example.com/v2",
            published_at: "2026-01-01T00:00:00Z",
          }),
        ),
      );
    const api = await loadApiModule();

    const result = await api.fetchAlphaclawReleaseNotes("v2");

    expect(global.fetch.mock.calls[1][0]).toBe(
      "https://api.github.com/repos/chrysb/alphaclaw/releases/tags/v2",
    );
    expect(result).toEqual({
      ok: true,
      tag: "v2",
      name: "Release 2",
      body: "Notes",
      htmlUrl: "https://example.com/v2",
      publishedAt: "2026-01-01T00:00:00Z",
    });
  });

  it("fetchAlphaclawReleaseNotes falls back to the latest release endpoint", async () => {
    global.fetch
      .mockResolvedValueOnce(mockTextResponse(500, "boom"))
      .mockResolvedValueOnce(mockTextResponse(200, ""));
    const api = await loadApiModule();

    const result = await api.fetchAlphaclawReleaseNotes();

    expect(global.fetch.mock.calls[1][0]).toBe(
      "https://api.github.com/repos/chrysb/alphaclaw/releases/latest",
    );
    expect(result).toEqual({
      ok: true,
      tag: "",
      name: "",
      body: "",
      htmlUrl: "",
      publishedAt: "",
    });
  });

  it("fetchAlphaclawReleaseNotes surfaces raw fallback text errors", async () => {
    global.fetch
      .mockResolvedValueOnce(mockTextResponse(500, "boom"))
      .mockResolvedValueOnce(mockTextResponse(500, "oops"));
    const api = await loadApiModule();

    await expect(api.fetchAlphaclawReleaseNotes()).rejects.toThrow("oops");
  });

  it("fetchAlphaclawReleaseNotes surfaces GitHub error messages", async () => {
    global.fetch
      .mockResolvedValueOnce(mockTextResponse(500, "boom"))
      .mockResolvedValueOnce(
        mockTextResponse(403, JSON.stringify({ message: "rate limited" })),
      );
    const api = await loadApiModule();

    await expect(api.fetchAlphaclawReleaseNotes()).rejects.toThrow("rate limited");
  });

  it("fetchSyncCron throws on invalid JSON and API errors", async () => {
    const api = await loadApiModule();

    global.fetch.mockResolvedValue(mockTextResponse(200, "garbage"));
    await expect(api.fetchSyncCron()).rejects.toThrow("garbage");

    global.fetch.mockResolvedValue(mockTextResponse(400, JSON.stringify({ error: "bad" })));
    await expect(api.fetchSyncCron()).rejects.toThrow("bad");
  });

  it("updateSyncCron throws on invalid JSON and API errors", async () => {
    const api = await loadApiModule();

    global.fetch.mockResolvedValue(mockTextResponse(200, "garbage"));
    await expect(api.updateSyncCron({})).rejects.toThrow("garbage");

    global.fetch.mockResolvedValue(mockTextResponse(400, JSON.stringify({ error: "bad" })));
    await expect(api.updateSyncCron({})).rejects.toThrow("bad");
  });

  it("updateOpenAiCompatApiFeature throws on invalid JSON and API errors", async () => {
    const api = await loadApiModule();

    global.fetch.mockResolvedValue(mockTextResponse(200, "garbage"));
    await expect(api.updateOpenAiCompatApiFeature(true)).rejects.toThrow("garbage");

    global.fetch.mockResolvedValue(mockTextResponse(400, JSON.stringify({ error: "bad" })));
    await expect(api.updateOpenAiCompatApiFeature(false)).rejects.toThrow("bad");
  });

  it("saveEnvVars throws raw text for invalid JSON responses", async () => {
    global.fetch.mockResolvedValue(mockTextResponse(200, "garbage"));
    const api = await loadApiModule();

    await expect(api.saveEnvVars([])).rejects.toThrow("garbage");
  });
});
