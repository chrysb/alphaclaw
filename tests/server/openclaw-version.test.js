const childProcess = require("child_process");

const { kNpmPackageRoot } = require("../../lib/server/constants");
const modulePath = require.resolve("../../lib/server/openclaw-version");
const originalExec = childProcess.exec;
const originalExecSync = childProcess.execSync;

const loadVersionModule = ({ execMock, execSyncMock }) => {
  childProcess.exec = execMock;
  childProcess.execSync = execSyncMock;
  delete require.cache[modulePath];
  return require(modulePath);
};

const createService = ({ isOnboarded = false } = {}) => {
  const execMock = vi.fn();
  const execSyncMock = vi.fn();
  const { createOpenclawVersionService } = loadVersionModule({
    execMock,
    execSyncMock,
  });
  const gatewayEnv = vi.fn(() => ({ OPENCLAW_GATEWAY_TOKEN: "token" }));
  const restartGateway = vi.fn();
  const service = createOpenclawVersionService({
    gatewayEnv,
    restartGateway,
    isOnboarded: () => isOnboarded,
  });
  return { service, gatewayEnv, restartGateway, execMock, execSyncMock };
};

describe("server/openclaw-version", () => {
  afterEach(() => {
    childProcess.exec = originalExec;
    childProcess.execSync = originalExecSync;
    delete require.cache[modulePath];
  });

  it("reads current version and uses cache within TTL", () => {
    const { service, gatewayEnv, execSyncMock } = createService();
    execSyncMock.mockReturnValue("openclaw 1.2.3\n");

    const first = service.readOpenclawVersion();
    const second = service.readOpenclawVersion();

    expect(first).toBe("1.2.3");
    expect(second).toBe("1.2.3");
    expect(execSyncMock).toHaveBeenCalledTimes(1);
    expect(execSyncMock).toHaveBeenCalledWith("openclaw --version", {
      env: gatewayEnv(),
      timeout: 5000,
      encoding: "utf8",
    });
  });

  it("returns update availability when latest version is newer", async () => {
    const { service, execSyncMock } = createService();
    execSyncMock.mockReturnValueOnce("openclaw 1.2.3").mockReturnValueOnce(
      JSON.stringify({
        availability: { available: true, latestVersion: "1.3.0" },
      }),
    );

    const status = await service.getVersionStatus(false);

    expect(status).toEqual({
      ok: true,
      currentVersion: "1.2.3",
      latestVersion: "1.3.0",
      hasUpdate: true,
    });
  });

  it("parses update status json from noisy CLI output", async () => {
    const { service, execSyncMock } = createService();
    execSyncMock
      .mockReturnValueOnce("openclaw 1.2.3")
      .mockReturnValueOnce(
        `[plugins] [auth]\n${JSON.stringify({
          availability: { available: true, latestVersion: "1.3.0" },
        })}`,
      );

    const status = await service.getVersionStatus(false);

    expect(status).toEqual({
      ok: true,
      currentVersion: "1.2.3",
      latestVersion: "1.3.0",
      hasUpdate: true,
    });
  });

  it("returns error status when update status command fails", async () => {
    const { service, execSyncMock } = createService();
    execSyncMock
      .mockReturnValueOnce("openclaw 1.2.3")
      .mockImplementationOnce(() => {
        throw new Error("status check failed");
      });

    const status = await service.getVersionStatus(false);

    expect(status.ok).toBe(false);
    expect(status.currentVersion).toBe("1.2.3");
    expect(status.latestVersion).toBe(null);
    expect(status.hasUpdate).toBe(false);
    expect(status.error).toContain("status check failed");
  });

  it("updates openclaw and restarts gateway when onboarded", async () => {
    const { service, restartGateway, execMock, execSyncMock } = createService({
      isOnboarded: true,
    });
    execSyncMock
      .mockReturnValueOnce("openclaw 1.0.0")
      .mockReturnValueOnce("openclaw 1.1.0")
      .mockReturnValueOnce(
        JSON.stringify({
          availability: { available: false, latestVersion: "1.1.0" },
        }),
      );
    execMock.mockImplementation((cmd, opts, callback) => {
      callback(null, "installed", "");
    });

    const result = await service.updateOpenclaw();

    expect(result.status).toBe(200);
    expect(result.body).toEqual(
      expect.objectContaining({
        ok: true,
        previousVersion: "1.0.0",
        currentVersion: "1.1.0",
        latestVersion: "1.1.0",
        hasUpdate: false,
        restarted: true,
        updated: true,
      }),
    );
    expect(execMock).toHaveBeenCalledTimes(2);
    expect(execMock).toHaveBeenNthCalledWith(
      1,
      "npm install --omit=dev --prefer-online --package-lock=false",
      expect.objectContaining({
        env: expect.objectContaining({
          npm_config_update_notifier: "false",
          npm_config_fund: "false",
          npm_config_audit: "false",
        }),
        timeout: 180000,
      }),
      expect.any(Function),
    );
    expect(execMock).toHaveBeenNthCalledWith(
      2,
      expect.stringMatching(/^cp -af /),
      expect.objectContaining({ timeout: 60000 }),
      expect.any(Function),
    );
    expect(restartGateway).toHaveBeenCalledTimes(1);
  });

  it("returns 409 while another update is in progress", async () => {
    const { service, execMock, execSyncMock } = createService();
    execSyncMock.mockImplementation((command) => {
      if (command === "openclaw --version") {
        return "openclaw 1.0.0";
      }
      if (command === "openclaw update status --json") {
        return JSON.stringify({
          availability: { available: true, latestVersion: "1.1.0" },
        });
      }
      throw new Error(`Unexpected command: ${command}`);
    });
    const callbacks = [];
    execMock.mockImplementation((cmd, opts, callback) => {
      callbacks.push(callback);
    });

    const firstUpdatePromise = service.updateOpenclaw();
    await new Promise((resolve) => {
      setImmediate(resolve);
    });
    const secondUpdate = await service.updateOpenclaw();

    expect(secondUpdate.status).toBe(409);
    expect(secondUpdate.body).toEqual({
      ok: false,
      error: "OpenClaw update already in progress",
    });

    callbacks[0](null, "installed", "");
    await new Promise((resolve) => {
      setImmediate(resolve);
    });
    callbacks[1](null, "", "");
    await firstUpdatePromise;
  });
});
