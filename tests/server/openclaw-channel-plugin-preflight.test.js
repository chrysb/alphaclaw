const {
  reconcileOpenclawChannelPlugins,
} = require("../../lib/server/openclaw-channel-plugin-preflight");

const kPackageInfo = {
  dir: "/tmp/openclaw",
  pkg: { name: "openclaw", version: "2026.9.3", bin: "openclaw.mjs" },
};

describe("server/openclaw-channel-plugin-preflight", () => {
  it("aligns enabled trusted channel plugins with the OpenClaw core version", () => {
    const execFileSyncImpl = vi.fn((_executable, args) => {
      if (args[1] === "plugins" && args[2] === "list") {
        return JSON.stringify({
          plugins: [
            {
              id: "slack",
              version: "2026.5.28",
              enabled: true,
              trustedOfficialInstall: true,
              channelIds: ["slack"],
            },
            {
              id: "telegram",
              version: "2026.9.3",
              enabled: true,
              trustedOfficialInstall: true,
              channelIds: ["telegram"],
            },
            {
              id: "community-channel",
              version: "1.0.0",
              enabled: true,
              trustedOfficialInstall: false,
              channelIds: ["community"],
            },
          ],
        });
      }
      return "";
    });

    const result = reconcileOpenclawChannelPlugins({
      execFileSyncImpl,
      packageInfo: kPackageInfo,
    });

    expect(result).toEqual({
      updated: [
        { id: "slack", fromVersion: "2026.5.28", toVersion: "2026.9.3" },
      ],
    });
    expect(execFileSyncImpl).toHaveBeenCalledTimes(2);
    expect(execFileSyncImpl).toHaveBeenNthCalledWith(
      2,
      process.execPath,
      [
        "/tmp/openclaw/openclaw.mjs",
        "plugins",
        "update",
        "slack",
        "--accept-capabilities",
        "--acknowledge-install-policy-warning",
      ],
      expect.objectContaining({ timeout: 150_000 }),
    );
  });

  it("does not update current, disabled, or non-official plugins", () => {
    const execFileSyncImpl = vi.fn(() =>
      JSON.stringify({
        plugins: [
          {
            id: "slack",
            version: "2026.9.3",
            enabled: true,
            trustedOfficialInstall: true,
            channelIds: ["slack"],
          },
          {
            id: "discord",
            version: "2026.7.1",
            enabled: false,
            trustedOfficialInstall: true,
            channelIds: ["discord"],
          },
        ],
      }),
    );

    expect(
      reconcileOpenclawChannelPlugins({
        execFileSyncImpl,
        packageInfo: kPackageInfo,
      }),
    ).toEqual({ updated: [] });
    expect(execFileSyncImpl).toHaveBeenCalledTimes(1);
  });
});
