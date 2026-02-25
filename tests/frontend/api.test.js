const loadApiModule = async () => import("../../lib/public/js/lib/api.js");

const mockJsonResponse = (status, payload) => ({
  status,
  json: async () => payload,
});

describe("frontend/api", () => {
  beforeEach(() => {
    global.fetch = vi.fn();
    global.window = { location: { href: "http://localhost/" } };
  });

  it("fetchStatus returns parsed JSON on success", async () => {
    const payload = { gateway: "running" };
    global.fetch.mockResolvedValue(mockJsonResponse(200, payload));
    const api = await loadApiModule();

    const result = await api.fetchStatus();

    expect(global.fetch).toHaveBeenCalledWith("/api/status", {});
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

    expect(global.fetch).toHaveBeenCalledWith("/api/onboard", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ vars, modelKey }),
    });
    expect(result).toEqual({ ok: true });
  });

  it("saveEnvVars uses PUT with expected request body", async () => {
    global.fetch.mockResolvedValue(mockJsonResponse(200, { ok: true, changed: true }));
    const api = await loadApiModule();
    const vars = [{ key: "GITHUB_TOKEN", value: "ghp_123" }];

    const result = await api.saveEnvVars(vars);

    expect(global.fetch).toHaveBeenCalledWith("/api/env", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ vars }),
    });
    expect(result).toEqual({ ok: true, changed: true });
  });
});
