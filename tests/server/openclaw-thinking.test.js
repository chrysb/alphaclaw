const {
  normalizeThinkingLevel,
  resolveThinkingOptionsForModel,
} = require("../../lib/server/openclaw-thinking");

describe("server/openclaw-thinking", () => {
  it("normalizes modern thinking levels without private OpenClaw exports", () => {
    expect(normalizeThinkingLevel("extra-high")).toBe("xhigh");
    expect(normalizeThinkingLevel("max")).toBe("max");
    expect(normalizeThinkingLevel("ultra")).toBe("ultra");
    expect(normalizeThinkingLevel("unknown")).toBeNull();
  });

  it("exposes Ultra for Codex Sol and Terra but not Luna", async () => {
    const optionsByModel = {};
    for (const model of ["gpt-5.6-sol", "gpt-5.6-terra", "gpt-5.6-luna"]) {
      optionsByModel[model] = await resolveThinkingOptionsForModel({
        modelKey: `openai/${model}`,
        agentRuntime: "codex",
      });
    }

    expect(optionsByModel["gpt-5.6-sol"].levels.map((entry) => entry.id)).toContain(
      "ultra",
    );
    expect(optionsByModel["gpt-5.6-terra"].levels.map((entry) => entry.id)).toContain(
      "ultra",
    );
    expect(optionsByModel["gpt-5.6-luna"].levels.map((entry) => entry.id)).not.toContain(
      "ultra",
    );
    expect(optionsByModel["gpt-5.6-luna"].levels.map((entry) => entry.id)).toContain(
      "max",
    );
  });
});
