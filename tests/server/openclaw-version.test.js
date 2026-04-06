const fs = require("fs");
const path = require("path");
const childProcess = require("child_process");

const { kRootDir } = require("../../lib/server/constants");
const modulePath = require.resolve("../../lib/server/openclaw-version");
const originalExecSync = childProcess.execSync;

const loadVersionModule = ({ execSyncMock }) => {
  childProcess.execSync = execSyncMock;
  delete require.cache[modulePath];
  return require(modulePath);
};

const createService = ({ isOnboarded = false } = {}) => {
  const execSyncMock = vi.fn();
  const { createOpenclawVersionService } = loadVersionModule({
    execSyncMock,
  });
  const gatewayEnv = vi.fn(() => ({ OPENCLAW_GATEWAY_TOKEN: "token" }));
  const restartGateway = vi.fn();
  const service = createOpenclawVersionService({
    gatewayEnv,
    restartGateway,
    isOnboarded: () => isOnboarded,
  });
  return { service, gatewayEnv, restartGateway, execSyncMock };
};

describe("server/openclaw-version", () => {
  afterEach(() => {
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

  it("queues an exact openclaw update and requests restart", async () => {
    const { service, restartGateway, execSyncMock } = createService();
    execSyncMock.mockReturnValueOnce("openclaw 1.0.0").mockReturnValueOnce(
      JSON.stringify({
        availability: { available: true, latestVersion: "1.1.0" },
      }),
    );
    const writeSpy = vi.spyOn(fs, "writeFileSync");

    const result = await service.updateOpenclaw();

    expect(result.status).toBe(200);
    expect(result.body).toEqual(
      expect.objectContaining({
        ok: true,
        previousVersion: "1.0.0",
        currentVersion: "1.0.0",
        targetVersion: "1.1.0",
        latestVersion: "1.1.0",
        hasUpdate: true,
        restarted: false,
        restarting: true,
        updated: true,
      }),
    );
    const markerPath = path.join(kRootDir, ".openclaw-update-pending");
    const markerCall = writeSpy.mock.calls.find((call) => call[0] === markerPath);
    expect(markerCall).toBeTruthy();
    expect(JSON.parse(markerCall[1])).toMatchObject({
      from: "1.0.0",
      to: "1.1.0",
      spec: "openclaw@1.1.0",
    });
    expect(restartGateway).not.toHaveBeenCalled();

    writeSpy.mockRestore();
  });

  it("returns without restart when openclaw is already current", async () => {
    const { service, restartGateway, execSyncMock } = createService({
      isOnboarded: true,
    });
    execSyncMock.mockReturnValueOnce("openclaw 1.1.0").mockReturnValueOnce(
      JSON.stringify({
        availability: { available: false, latestVersion: "1.1.0" },
      }),
    );

    const result = await service.updateOpenclaw();

    expect(result.status).toBe(200);
    expect(result.body).toEqual(
      expect.objectContaining({
        ok: true,
        previousVersion: "1.1.0",
        currentVersion: "1.1.0",
        latestVersion: "1.1.0",
        hasUpdate: false,
        restarted: false,
        restarting: false,
        updated: false,
      }),
    );
    expect(restartGateway).not.toHaveBeenCalled();
  });

  it("falls back to latest marker when version resolution fails", async () => {
    const { service, execSyncMock } = createService();
    execSyncMock
      .mockReturnValueOnce("openclaw 1.0.0")
      .mockImplementationOnce(() => {
        throw new Error("status check failed");
      });
    const writeSpy = vi.spyOn(fs, "writeFileSync");

    const result = await service.updateOpenclaw();

    expect(result.status).toBe(200);
    expect(result.body).toEqual(
      expect.objectContaining({
        ok: true,
        previousVersion: "1.0.0",
        currentVersion: "1.0.0",
        targetVersion: null,
        latestVersion: null,
        hasUpdate: true,
        restarting: true,
      }),
    );
    const markerPath = path.join(kRootDir, ".openclaw-update-pending");
    const markerCall = writeSpy.mock.calls.find((call) => call[0] === markerPath);
    expect(markerCall).toBeTruthy();
    expect(JSON.parse(markerCall[1])).toMatchObject({
      from: "1.0.0",
      to: "latest",
      spec: "openclaw@latest",
    });

    writeSpy.mockRestore();
  });

  it("returns 500 when it cannot write the pending update marker", async () => {
    const { service, execSyncMock } = createService();
    execSyncMock.mockReturnValueOnce("openclaw 1.0.0").mockReturnValueOnce(
      JSON.stringify({
        availability: { available: true, latestVersion: "1.1.0" },
      }),
    );
    const writeSpy = vi.spyOn(fs, "writeFileSync").mockImplementation((targetPath) => {
      if (targetPath === path.join(kRootDir, ".openclaw-update-pending")) {
        throw new Error("disk full");
      }
      return undefined;
    });

    const result = await service.updateOpenclaw();

    expect(result.status).toBe(500);
    expect(result.body.ok).toBe(false);
    expect(result.body.error).toContain("disk full");

    writeSpy.mockRestore();
  });

});
