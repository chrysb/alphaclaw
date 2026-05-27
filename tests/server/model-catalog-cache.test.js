const fs = require("fs");
const os = require("os");
const path = require("path");

const {
  createModelCatalogCache,
  kModelCatalogRefreshBackoffMs,
} = require("../../lib/server/model-catalog-cache");
const { kFallbackOnboardingModels } = require("../../lib/server/constants");

const flushPromises = async () => {
  await Promise.resolve();
  await Promise.resolve();
};

const normalizeModels = (models = []) =>
  (Array.isArray(models) ? models : [])
    .filter((model) => model?.key)
    .map((model) => ({
      key: model.key,
      provider: String(model.key).split("/")[0] || "",
      label: model.name || model.label || model.key,
    }));

const writeCacheFile = ({ cachePath, fetchedAt = 1000, models = [] }) => {
  fs.mkdirSync(path.dirname(cachePath), { recursive: true });
  fs.writeFileSync(
    cachePath,
    `${JSON.stringify({ version: 1, fetchedAt, models }, null, 2)}\n`,
    "utf8",
  );
};

describe("server/model-catalog-cache", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns cached models immediately and shares a single in-flight refresh", async () => {
    const tempRoot = fs.mkdtempSync(
      path.join(os.tmpdir(), "alphaclaw-model-catalog-cache-"),
    );
    const cachePath = path.join(tempRoot, "cache", "model-catalog.json");
    writeCacheFile({
      cachePath,
      fetchedAt: 111,
      models: normalizeModels([{ key: "openai/gpt-cached", label: "Cached" }]),
    });

    let resolveShell;
    const shellCmd = vi.fn(
      () =>
        new Promise((resolve) => {
          resolveShell = resolve;
        }),
    );
    const parseJsonFromNoisyOutput = vi.fn(() => ({
      models: [{ key: "openai/gpt-fresh", name: "Fresh" }],
    }));
    const cache = createModelCatalogCache({
      cachePath,
      shellCmd,
      gatewayEnv: () => ({ OPENCLAW_GATEWAY_TOKEN: "token" }),
      parseJsonFromNoisyOutput,
      normalizeOnboardingModels: normalizeModels,
    });

    const first = await cache.getCatalogResponse();
    const second = await cache.getCatalogResponse();

    expect(first).toEqual({
      ok: true,
      source: "cache",
      fetchedAt: 111,
      stale: true,
      refreshing: true,
      models: normalizeModels([{ key: "openai/gpt-cached", label: "Cached" }]),
    });
    expect(second.source).toBe("cache");
    expect(second.refreshing).toBe(true);
    expect(shellCmd).toHaveBeenCalledTimes(1);

    resolveShell("{}");
    await flushPromises();

    const fresh = await cache.getCatalogResponse();
    expect(fresh).toEqual({
      ok: true,
      source: "openclaw",
      fetchedAt: expect.any(Number),
      stale: false,
      refreshing: false,
      models: normalizeModels([{ key: "openai/gpt-fresh", name: "Fresh" }]),
    });
    const written = JSON.parse(fs.readFileSync(cachePath, "utf8"));
    expect(written.models).toEqual(
      normalizeModels([{ key: "openai/gpt-fresh", name: "Fresh" }]),
    );
  });

  it("keeps serving cache after refresh failures and retries after backoff", async () => {
    vi.useFakeTimers();
    const tempRoot = fs.mkdtempSync(
      path.join(os.tmpdir(), "alphaclaw-model-catalog-backoff-"),
    );
    const cachePath = path.join(tempRoot, "cache", "model-catalog.json");
    writeCacheFile({
      cachePath,
      fetchedAt: 222,
      models: normalizeModels([{ key: "openai/gpt-cached", label: "Cached" }]),
    });

    const shellCmd = vi
      .fn()
      .mockRejectedValueOnce(new Error("boom"))
      .mockResolvedValueOnce("{}");
    const parseJsonFromNoisyOutput = vi.fn(() => ({
      models: [{ key: "openai/gpt-retried", name: "Retried" }],
    }));
    const cache = createModelCatalogCache({
      cachePath,
      shellCmd,
      parseJsonFromNoisyOutput,
      normalizeOnboardingModels: normalizeModels,
      setTimeoutFn: setTimeout,
      clearTimeoutFn: clearTimeout,
    });

    const cached = await cache.getCatalogResponse();
    expect(cached.source).toBe("cache");
    expect(cached.refreshing).toBe(true);
    expect(shellCmd).toHaveBeenCalledTimes(1);

    await flushPromises();

    const afterFailure = await cache.getCatalogResponse();
    expect(afterFailure).toEqual({
      ok: true,
      source: "cache",
      fetchedAt: 222,
      stale: true,
      refreshing: true,
      models: normalizeModels([{ key: "openai/gpt-cached", label: "Cached" }]),
    });

    await vi.advanceTimersByTimeAsync(kModelCatalogRefreshBackoffMs - 1);
    expect(shellCmd).toHaveBeenCalledTimes(1);

    await vi.advanceTimersByTimeAsync(1);
    await flushPromises();
    expect(shellCmd).toHaveBeenCalledTimes(2);

    const fresh = await cache.getCatalogResponse();
    expect(fresh).toEqual({
      ok: true,
      source: "openclaw",
      fetchedAt: expect.any(Number),
      stale: false,
      refreshing: false,
      models: normalizeModels([{ key: "openai/gpt-retried", name: "Retried" }]),
    });
  });

  it("falls back when no cache exists and the CLI load fails", async () => {
    const tempRoot = fs.mkdtempSync(
      path.join(os.tmpdir(), "alphaclaw-model-catalog-fallback-"),
    );
    const cachePath = path.join(tempRoot, "cache", "model-catalog.json");
    const shellCmd = vi.fn().mockRejectedValue(new Error("boom"));
    const cache = createModelCatalogCache({
      cachePath,
      shellCmd,
      parseJsonFromNoisyOutput: vi.fn(() => ({})),
      normalizeOnboardingModels: normalizeModels,
    });

    const response = await cache.getCatalogResponse();

    expect(response).toEqual({
      ok: true,
      source: "fallback",
      fetchedAt: null,
      stale: false,
      refreshing: false,
      models: kFallbackOnboardingModels,
    });
  });
});
