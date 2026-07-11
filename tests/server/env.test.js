const fs = require("fs");
const os = require("os");
const path = require("path");

const envModulePath = "../../lib/server/env";
const constantsModulePath = "../../lib/server/constants";

const loadEnvModule = (rootDir) => {
  vi.resetModules();
  process.env.ALPHACLAW_ROOT_DIR = rootDir;
  return require(envModulePath);
};

describe("server/env", () => {
  let tmpDir;
  let previousRootDir;
  let previousOpenAiApiKey;
  let previousBrightdataApiKey;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "alphaclaw-env-"));
    previousRootDir = process.env.ALPHACLAW_ROOT_DIR;
    previousOpenAiApiKey = process.env.OPENAI_API_KEY;
    previousBrightdataApiKey = process.env.BRIGHTDATA_API_KEY;
    delete process.env.OPENAI_API_KEY;
    delete process.env.BRIGHTDATA_API_KEY;
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
    delete require.cache[require.resolve(envModulePath)];
    delete require.cache[require.resolve(constantsModulePath)];
    if (previousRootDir === undefined) {
      delete process.env.ALPHACLAW_ROOT_DIR;
    } else {
      process.env.ALPHACLAW_ROOT_DIR = previousRootDir;
    }
    if (previousOpenAiApiKey === undefined) {
      delete process.env.OPENAI_API_KEY;
    } else {
      process.env.OPENAI_API_KEY = previousOpenAiApiKey;
    }
    if (previousBrightdataApiKey === undefined) {
      delete process.env.BRIGHTDATA_API_KEY;
    } else {
      process.env.BRIGHTDATA_API_KEY = previousBrightdataApiKey;
    }
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it("reads duplicate env keys with last-wins semantics", () => {
    fs.writeFileSync(
      path.join(tmpDir, ".env"),
      [
        "OPENAI_API_KEY=first",
        "BRIGHTDATA_API_KEY=bright",
        "OPENAI_API_KEY=second",
      ].join("\n"),
    );
    const env = loadEnvModule(tmpDir);

    expect(env.readEnvFile()).toEqual([
      { key: "BRIGHTDATA_API_KEY", value: "bright" },
      { key: "OPENAI_API_KEY", value: "second" },
    ]);
  });

  it("reloads duplicate keys idempotently after the effective value is loaded", () => {
    fs.writeFileSync(
      path.join(tmpDir, ".env"),
      ["OPENAI_API_KEY=first", "OPENAI_API_KEY=second"].join("\n"),
    );
    const env = loadEnvModule(tmpDir);
    const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});

    expect(env.reloadEnv()).toBe(true);
    expect(process.env.OPENAI_API_KEY).toBe("second");
    expect(env.reloadEnv()).toBe(false);
    expect(
      logSpy.mock.calls.filter(([line]) => String(line).includes("Env updated")),
    ).toHaveLength(1);
  });

  it("writes a deduped env file using the last value for each key", () => {
    const env = loadEnvModule(tmpDir);

    env.writeEnvFile([
      { key: "OPENAI_API_KEY", value: "first" },
      { key: "BRIGHTDATA_API_KEY", value: "bright" },
      { key: "OPENAI_API_KEY", value: "second" },
    ]);

    expect(fs.readFileSync(path.join(tmpDir, ".env"), "utf8")).toBe(
      "BRIGHTDATA_API_KEY=bright\nOPENAI_API_KEY=second",
    );
  });

  it("debounces env watcher events and ignores AlphaClaw's own writes", () => {
    vi.useFakeTimers();
    fs.writeFileSync(path.join(tmpDir, ".env"), "OPENAI_API_KEY=first");
    const env = loadEnvModule(tmpDir);
    const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    let watchHandler = null;
    const watchSpy = vi
      .spyOn(fs, "watchFile")
      .mockImplementation((filePath, options, handler) => {
        watchHandler = handler;
      });

    env.startEnvWatcher();
    expect(watchSpy).toHaveBeenCalled();

    env.writeEnvFile([{ key: "OPENAI_API_KEY", value: "second" }]);
    watchHandler();
    vi.advanceTimersByTime(250);

    expect(process.env.OPENAI_API_KEY).toBeUndefined();
    expect(logSpy).not.toHaveBeenCalledWith(
      expect.stringContaining("changed externally, reloading"),
    );

    fs.writeFileSync(path.join(tmpDir, ".env"), "OPENAI_API_KEY=third");
    watchHandler();
    fs.writeFileSync(path.join(tmpDir, ".env"), "OPENAI_API_KEY=fourth");
    watchHandler();
    vi.advanceTimersByTime(249);
    expect(process.env.OPENAI_API_KEY).toBeUndefined();
    vi.advanceTimersByTime(1);

    expect(process.env.OPENAI_API_KEY).toBe("fourth");
    expect(
      logSpy.mock.calls.filter(([line]) =>
        String(line).includes("changed externally, reloading"),
      ),
    ).toHaveLength(1);
  });
});
