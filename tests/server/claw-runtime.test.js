const path = require("path");

const {
  createClawRuntime,
  normalizeRuntimeId,
} = require("../../lib/server/claw-runtime");

describe("server/claw-runtime", () => {
  it("defaults to the OpenClaw runtime", () => {
    const runtime = createClawRuntime({
      rootDir: "/data",
      env: {},
    });

    expect(runtime.id).toBe("openclaw");
    expect(runtime.profileArgs).toEqual([]);
    expect(runtime.stateDir).toBe(path.join("/data", ".openclaw"));
    expect(runtime.workspaceDir).toBe(path.join("/data", ".openclaw", "workspace"));
    expect(runtime.defaultGatewayPort).toBe(18789);
    expect(runtime.buildArgs(["gateway", "run"])).toEqual(["gateway", "run"]);
    expect(runtime.buildCommand("models list --json")).toBe(
      "openclaw models list --json",
    );
  });

  it("enables DenchClaw profile and state paths", () => {
    const runtime = createClawRuntime({
      rootDir: "/data",
      env: { ALPHACLAW_CLAW_RUNTIME: "denchclaw" },
    });

    expect(runtime.id).toBe("denchclaw");
    expect(runtime.profile).toBe("dench");
    expect(runtime.profileArgs).toEqual(["--profile", "dench"]);
    expect(runtime.stateDir).toBe(path.join("/data", ".openclaw-dench"));
    expect(runtime.workspaceDir).toBe(
      path.join("/data", ".openclaw-dench", "workspace"),
    );
    expect(runtime.defaultGatewayPort).toBe(19001);
    expect(runtime.denchWebPort).toBe(3100);
    expect(runtime.env).toEqual(
      expect.objectContaining({
        DENCHCLAW_DAEMONLESS: "1",
        OPENCLAW_PROFILE: "dench",
        OPENCLAW_STATE_DIR: path.join("/data", ".openclaw-dench"),
        OPENCLAW_CONFIG_PATH: path.join("/data", ".openclaw-dench", "openclaw.json"),
      }),
    );
    expect(runtime.buildArgs(["gateway", "run"])).toEqual([
      "--profile",
      "dench",
      "gateway",
      "run",
    ]);
    expect(runtime.buildCommand("gateway restart")).toBe(
      "openclaw --profile dench gateway restart",
    );
  });

  it("accepts Dench aliases and gateway port overrides", () => {
    expect(normalizeRuntimeId("dench")).toBe("denchclaw");
    expect(normalizeRuntimeId("dench-claw")).toBe("denchclaw");

    const runtime = createClawRuntime({
      rootDir: "/data",
      env: {
        ALPHACLAW_CLAW_RUNTIME: "dench",
        ALPHACLAW_GATEWAY_PORT: "19111",
        DENCHCLAW_WEB_PORT: "3111",
      },
    });

    expect(runtime.defaultGatewayPort).toBe(19111);
    expect(runtime.denchWebPort).toBe(3111);
  });
});
