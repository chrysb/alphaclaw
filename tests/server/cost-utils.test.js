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

  it("prices provider-qualified GPT-5.5 correctly without gpt-5 shadowing", () => {
    const breakdown = deriveCostBreakdown({
      provider: "openai",
      model: "openai/gpt-5.5",
      inputTokens: 1_000_000,
      outputTokens: 1_000_000,
    });

    expect(breakdown.pricingFound).toBe(true);
    // GPT-5.5 is input: 5.0, output: 30.0 (total $35.0 per million)
    // GPT-5 would be input: 1.25, output: 10.0 (total $11.25 per million)
    expect(breakdown.totalCost).toBeCloseTo(35.0, 8);
  });

  it("prices provider-qualified GPT-5.4-mini correctly without gpt-5 shadowing", () => {
    const breakdown = deriveCostBreakdown({
      provider: "openai",
      model: "openai/gpt-5.4-mini",
      inputTokens: 1_000_000,
      outputTokens: 1_000_000,
    });

    expect(breakdown.pricingFound).toBe(true);
    // GPT-5.4-mini is input: 0.75, output: 4.5 (total $5.25 per million)
    expect(breakdown.totalCost).toBeCloseTo(5.25, 8);
  });
});
