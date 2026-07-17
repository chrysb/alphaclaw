const { deriveCostBreakdown } = require("../../lib/server/cost-utils");

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
