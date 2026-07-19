const Module = require("module");
const fs = require("fs");
const os = require("os");
const path = require("path");

const { deriveCostBreakdown } = require("../../lib/server/cost-utils");

const costUtilsPath = require.resolve("../../lib/server/cost-utils");
const originalResolveFilename = Module._resolveFilename;

describe("server/cost-utils", () => {
  it("prices Claude Opus 4.7 including prompt cache tokens", () => {
    const breakdown = deriveCostBreakdown({
      provider: "anthropic",
      model: "anthropic/claude-opus-4-7",
      inputTokens: 100_000,
      outputTokens: 10_000,
      cacheReadTokens: 800_000,
      cacheWriteTokens: 20_000,
    });

    expect(breakdown.pricingFound).toBe(true);
    expect(breakdown.inputCost).toBeCloseTo(0.5, 8);
    expect(breakdown.outputCost).toBeCloseTo(0.25, 8);
    expect(breakdown.cacheReadCost).toBeCloseTo(0.4, 8);
    expect(breakdown.cacheWriteCost).toBeCloseTo(0.125, 8);
    expect(breakdown.totalCost).toBeCloseTo(1.275, 8);
  });

  it("matches Claude Opus 4.7 dot-form model IDs", () => {
    const breakdown = deriveCostBreakdown({
      provider: "anthropic",
      model: "claude-opus-4.7",
      inputTokens: 1_000_000,
    });

    expect(breakdown.pricingFound).toBe(true);
    expect(breakdown.totalCost).toBeCloseTo(5, 8);
  });

  it("prices each GPT-5.6 tier", () => {
    const expected = {
      "gpt-5.6-sol": 35,
      "gpt-5.6-terra": 17.5,
      "gpt-5.6-luna": 7,
    };
    for (const [model, total] of Object.entries(expected)) {
      const breakdown = deriveCostBreakdown({
        provider: "openai",
        model,
        inputTokens: 1_000_000,
        outputTokens: 1_000_000,
      });
      expect(breakdown.pricingFound).toBe(true);
      expect(breakdown.totalCost).toBeCloseTo(total, 8);
    }
  });
});

describe("server/cost-utils openclaw dist pricing scraper", () => {
  let tmpRoot = null;

  const patchOpenclawResolution = (entryPath) => {
    Module._resolveFilename = function (request, ...rest) {
      if (request === "openclaw") {
        if (!entryPath) {
          const error = new Error("Cannot find module 'openclaw'");
          error.code = "MODULE_NOT_FOUND";
          throw error;
        }
        return entryPath;
      }
      return originalResolveFilename.call(this, request, ...rest);
    };
  };

  const loadFreshCostUtils = () => {
    delete require.cache[costUtilsPath];
    return require(costUtilsPath);
  };

  afterEach(() => {
    Module._resolveFilename = originalResolveFilename;
    delete require.cache[costUtilsPath];
    if (tmpRoot) {
      fs.rmSync(tmpRoot, { recursive: true, force: true });
      tmpRoot = null;
    }
  });

  it("scrapes pricing entries and default-model constants from dist files", () => {
    tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), "alphaclaw-cost-utils-"));
    const distDir = path.join(tmpRoot, "dist");
    fs.mkdirSync(distDir);
    fs.writeFileSync(
      path.join(distDir, "model-selection.js"),
      [
        'var a={id:"anthropic/claude-opus-4.7",cost:{input:11,output:22,cacheRead:1.1,cacheWrite:2.2}};',
        'var b={id:"anthropic/claude-sonnet-4-5",cost:{input:3,output:15}};',
        'var c={id:"broken/no-usable-cost",cost:{foo:1}};',
      ].join("\n"),
    );
    fs.writeFileSync(
      path.join(distDir, "config.js"),
      [
        'const FOO_DEFAULT_MODEL_ID = "openai/gpt-fake-default";',
        "const FOO_DEFAULT_COST = {input:2.5,output:10,cacheRead:0.25,cacheWrite:3.125};",
        "const BAR_DEFAULT_MODEL_REF = `qwen/qwen-fake`;",
      ].join("\n"),
    );
    fs.writeFileSync(
      path.join(distDir, "unrelated.js"),
      'var d={id:"skipped/model",cost:{input:1,output:2}};',
    );
    fs.writeFileSync(path.join(distDir, "notes.txt"), "not javascript");
    // A directory with a matching name forces the readFileSync failure branch.
    fs.mkdirSync(path.join(distDir, "configure.js"));

    patchOpenclawResolution(path.join(distDir, "index.js"));
    const costUtils = loadFreshCostUtils();
    const pricingMap = costUtils.loadOpenclawNodeModulesPricingMap();

    const opusPricing = {
      input: 11,
      output: 22,
      cacheRead: 1.1,
      cacheWrite: 2.2,
    };
    expect(pricingMap.get("anthropic/claude-opus-4.7")).toEqual(opusPricing);
    expect(pricingMap.get("anthropic/claude-opus-4-7")).toEqual(opusPricing);
    expect(pricingMap.get("claude-opus-4.7")).toEqual(opusPricing);
    expect(pricingMap.get("claude-opus-4-7")).toEqual(opusPricing);

    const sonnetPricing = { input: 3, output: 15, cacheRead: 0, cacheWrite: 0 };
    expect(pricingMap.get("anthropic/claude-sonnet-4-5")).toEqual(sonnetPricing);
    expect(pricingMap.get("anthropic/claude-sonnet-4.5")).toEqual(sonnetPricing);
    expect(pricingMap.get("claude-sonnet-4-5")).toEqual(sonnetPricing);
    expect(pricingMap.get("claude-sonnet-4.5")).toEqual(sonnetPricing);

    expect(pricingMap.get("openai/gpt-fake-default")).toEqual({
      input: 2.5,
      output: 10,
      cacheRead: 0.25,
      cacheWrite: 3.125,
    });
    expect(pricingMap.get("gpt-fake-default")).toBeTruthy();

    expect(pricingMap.has("broken/no-usable-cost")).toBe(false);
    expect(pricingMap.has("qwen/qwen-fake")).toBe(false);
    expect(pricingMap.has("skipped/model")).toBe(false);

    // Second load within the TTL returns the cached map instance.
    expect(costUtils.loadOpenclawNodeModulesPricingMap()).toBe(pricingMap);

    const breakdown = costUtils.deriveCostBreakdown({
      provider: "anthropic",
      model: "claude-opus-4-7",
      inputTokens: 1_000_000,
      outputTokens: 1_000_000,
      cacheReadTokens: 1_000_000,
      cacheWriteTokens: 1_000_000,
    });
    expect(breakdown.pricingFound).toBe(true);
    expect(breakdown.totalCost).toBeCloseTo(11 + 22 + 1.1 + 2.2, 8);

    expect(
      costUtils.resolvePricingFromOpenclawNodeModules({
        model: "anthropic/claude-sonnet-4-5",
      }),
    ).toEqual(sonnetPricing);
    expect(costUtils.resolvePricingFromOpenclawNodeModules({ model: "" })).toBe(
      null,
    );
    expect(
      costUtils.resolvePricingFromOpenclawNodeModules({
        provider: "x",
        model: "unknown-model-zzz",
      }),
    ).toBe(null);
  });

  it("falls back to the static pricing map when openclaw is not installed", () => {
    patchOpenclawResolution(null);
    const costUtils = loadFreshCostUtils();

    const longContext = costUtils.deriveCostBreakdown({
      provider: "anthropic",
      model: "claude-opus-4-6",
      inputTokens: 300_000,
      outputTokens: 250_000,
    });
    expect(longContext.pricingFound).toBe(true);
    expect(longContext.inputCost).toBeCloseTo(3, 8);
    expect(longContext.outputCost).toBeCloseTo(9.375, 8);

    const shortContext = costUtils.deriveCostBreakdown({
      provider: "anthropic",
      model: "claude-opus-4-6",
      inputTokens: 100_000,
      outputTokens: 100_000,
    });
    expect(shortContext.inputCost).toBeCloseTo(0.5, 8);
    expect(shortContext.outputCost).toBeCloseTo(2.5, 8);

    const substringMatch = costUtils.deriveCostBreakdown({
      provider: "anthropic",
      model: "claude-haiku-4-6-20260101",
      inputTokens: 1_000_000,
    });
    expect(substringMatch.pricingFound).toBe(true);
    expect(substringMatch.inputCost).toBeCloseTo(0.8, 8);

    const unknown = costUtils.deriveCostBreakdown({
      provider: "x",
      model: "totally-unknown-model",
    });
    expect(unknown).toEqual({
      inputCost: 0,
      outputCost: 0,
      cacheReadCost: 0,
      cacheWriteCost: 0,
      totalCost: 0,
      pricingFound: false,
    });

    expect(costUtils.deriveCostBreakdown({}).pricingFound).toBe(false);
  });

  it("returns an empty pricing map when the dist dir cannot be read", () => {
    patchOpenclawResolution(
      path.join(os.tmpdir(), "alphaclaw-missing-dist", "index.js"),
    );
    const costUtils = loadFreshCostUtils();

    const pricingMap = costUtils.loadOpenclawNodeModulesPricingMap();

    expect(pricingMap.size).toBe(0);
  });
});
