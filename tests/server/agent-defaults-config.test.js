const fs = require("fs");
const os = require("os");
const path = require("path");

const {
  MalformedOpenclawConfigError,
  kThinkingLevels,
  kDefaultThinkingLevel,
  kDefaultDreamingEnabled,
  normalizeAgentDefaults,
  readAgentDefaults,
  writeAgentDefaults,
} = require("../../lib/server/agent-defaults-config");

const createTempOpenclawDir = () =>
  fs.mkdtempSync(path.join(os.tmpdir(), "alphaclaw-agent-defaults-test-"));

describe("server/agent-defaults-config", () => {
  it("falls back to safe defaults when openclaw.json is missing or empty", () => {
    const openclawDir = createTempOpenclawDir();

    expect(readAgentDefaults({ fsModule: fs, openclawDir })).toEqual({
      thinking: kDefaultThinkingLevel,
      dreaming: kDefaultDreamingEnabled,
    });
  });

  it("normalizes invalid stored values to safe defaults", () => {
    expect(
      normalizeAgentDefaults({
        agentDefaults: { thinking: "ultra", dreaming: "yes" },
      }),
    ).toEqual({
      thinking: kDefaultThinkingLevel,
      dreaming: kDefaultDreamingEnabled,
    });
  });

  it("reads stored values verbatim when valid", () => {
    const openclawDir = createTempOpenclawDir();
    fs.writeFileSync(
      path.join(openclawDir, "openclaw.json"),
      JSON.stringify({
        agentDefaults: { thinking: "high", dreaming: true },
      }),
    );

    expect(readAgentDefaults({ fsModule: fs, openclawDir })).toEqual({
      thinking: "high",
      dreaming: true,
    });
  });

  it("writes only the keys provided and preserves existing siblings", () => {
    const openclawDir = createTempOpenclawDir();
    const configPath = path.join(openclawDir, "openclaw.json");
    fs.writeFileSync(
      configPath,
      JSON.stringify({
        tools: { profile: "full" },
        agentDefaults: { thinking: "low", dreaming: true },
      }),
    );

    const result = writeAgentDefaults({
      fsModule: fs,
      openclawDir,
      thinking: "high",
    });

    expect(result.changed).toBe(true);
    expect(result.agentDefaults).toEqual({ thinking: "high", dreaming: true });
    const stored = JSON.parse(fs.readFileSync(configPath, "utf8"));
    expect(stored).toEqual({
      tools: { profile: "full" },
      agentDefaults: { thinking: "high", dreaming: true },
    });
  });

  it("reports changed=false when the write is a no-op", () => {
    const openclawDir = createTempOpenclawDir();
    fs.writeFileSync(
      path.join(openclawDir, "openclaw.json"),
      JSON.stringify({
        agentDefaults: { thinking: "medium", dreaming: false },
      }),
    );

    const result = writeAgentDefaults({
      fsModule: fs,
      openclawDir,
      thinking: "medium",
      dreaming: false,
    });

    expect(result.changed).toBe(false);
  });

  it("rejects invalid thinking values", () => {
    const openclawDir = createTempOpenclawDir();
    expect(() =>
      writeAgentDefaults({ fsModule: fs, openclawDir, thinking: "max" }),
    ).toThrow(/thinking must be one of/);
  });

  it("exposes the canonical thinking level list", () => {
    expect(kThinkingLevels).toEqual(["off", "low", "medium", "high"]);
  });

  it("refuses to overwrite when openclaw.json exists but is malformed", () => {
    const openclawDir = createTempOpenclawDir();
    const configPath = path.join(openclawDir, "openclaw.json");
    fs.writeFileSync(configPath, "{ malformed:");

    expect(() =>
      writeAgentDefaults({ fsModule: fs, openclawDir, thinking: "high" }),
    ).toThrow(MalformedOpenclawConfigError);

    expect(fs.readFileSync(configPath, "utf8")).toBe("{ malformed:");
  });

  it("creates openclaw.json from scratch when absent", () => {
    const openclawDir = createTempOpenclawDir();
    const configPath = path.join(openclawDir, "openclaw.json");

    const result = writeAgentDefaults({
      fsModule: fs,
      openclawDir,
      thinking: "high",
      dreaming: true,
    });

    expect(result.changed).toBe(true);
    expect(JSON.parse(fs.readFileSync(configPath, "utf8"))).toEqual({
      agentDefaults: { thinking: "high", dreaming: true },
    });
  });
});
