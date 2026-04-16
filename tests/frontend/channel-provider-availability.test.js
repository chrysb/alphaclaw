const loadChannelProviderAvailabilityModule = async () =>
  import("../../lib/public/js/lib/channel-provider-availability.js");

describe("frontend/channel-provider-availability", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it("allows multiple Slack accounts while keeping Discord single-account", async () => {
    const {
      isSingleAccountChannelProvider,
      isChannelProviderDisabledForAdd,
    } = await loadChannelProviderAvailabilityModule();
    const configuredChannelMap = new Map([
      ["slack", { accounts: [{ id: "default" }] }],
      ["discord", { accounts: [{ id: "default" }] }],
    ]);

    expect(isSingleAccountChannelProvider("slack")).toBe(false);
    expect(isSingleAccountChannelProvider("discord")).toBe(true);
    expect(
      isChannelProviderDisabledForAdd({
        configuredChannelMap,
        provider: "slack",
      }),
    ).toBe(false);
    expect(
      isChannelProviderDisabledForAdd({
        configuredChannelMap,
        provider: "discord",
      }),
    ).toBe(true);
  });
});
