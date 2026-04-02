const childProcess = require("child_process");
const fs = require("fs");
const os = require("os");
const path = require("path");
const https = require("https");
const { EventEmitter } = require("events");

const {
  kNpmPackageRoot,
  kOpenclawUpdateCopyTimeoutMs,
  kRootDir,
} = require("../../lib/server/constants");
const modulePath = require.resolve("../../lib/server/alphaclaw-version");
const originalExec = childProcess.exec;
const originalHttpsGet = https.get;

const createMockHttpsGet = (responseJson) => {
  return vi.fn((url, opts, callback) => {
    const res = new EventEmitter();
    res.statusCode = 200;
    process.nextTick(() => {
      res.emit("data", JSON.stringify(responseJson));
      res.emit("end");
    });
    callback(res);
    const req = new EventEmitter();
    req.on = vi.fn().mockReturnThis();
    return req;
  });
};

const loadVersionModule = ({ execMock, httpsGetMock } = {}) => {
  if (execMock) childProcess.exec = execMock;
  if (httpsGetMock) https.get = httpsGetMock;
  delete require.cache[modulePath];
  return require(modulePath);
};

describe("server/alphaclaw-version", () => {
  afterEach(() => {
    childProcess.exec = originalExec;
    https.get = originalHttpsGet;
    delete require.cache[modulePath];
  });

  it("reads current version from package.json", () => {
    const { createAlphaclawVersionService } = loadVersionModule();
    const service = createAlphaclawVersionService();
    const version = service.readAlphaclawVersion();

    const expectedPkg = JSON.parse(
      fs.readFileSync(path.join(kNpmPackageRoot, "package.json"), "utf8"),
    );
    expect(version).toBe(expectedPkg.version);
  });

  it("returns version status and caches within TTL", async () => {
    const httpsGetMock = createMockHttpsGet({
      "dist-tags": { latest: "99.0.0" },
    });
    const { createAlphaclawVersionService } = loadVersionModule({
      httpsGetMock,
    });
    const service = createAlphaclawVersionService();

    const first = await service.getVersionStatus(false);
    expect(first.ok).toBe(true);
    expect(first.currentVersion).toBeTruthy();
    expect(first.latestVersion).toBe("99.0.0");
    expect(first.hasUpdate).toBe(true);

    const second = await service.getVersionStatus(false);
    expect(second.currentVersion).toBe(first.currentVersion);
    expect(second.latestVersion).toBe("99.0.0");
    // Should use cache — only one https.get call
    expect(httpsGetMock).toHaveBeenCalledTimes(1);
  });

  it("returns 409 while another update is in progress", async () => {
    const callbacks = [];
    const execMock = vi.fn().mockImplementation((cmd, opts, callback) => {
      callbacks.push(callback);
    });
    const { createAlphaclawVersionService } = loadVersionModule({ execMock });
    const service = createAlphaclawVersionService();

    const firstPromise = service.updateAlphaclaw();
    await new Promise((resolve) => setImmediate(resolve));

    const secondResult = await service.updateAlphaclaw();
    expect(secondResult.status).toBe(409);
    expect(secondResult.body).toEqual({
      ok: false,
      error: "AlphaClaw update already in progress",
    });

    callbacks[0](null, "installed", "");
    await new Promise((resolve) => {
      setImmediate(resolve);
    });
    callbacks[1](null, "", "");
    await firstPromise;
  });

  it("returns successful update result with restarting flag", async () => {
    const execMock = vi.fn().mockImplementation((cmd, opts, callback) => {
      callback(null, "added 1 package", "");
    });
    const { createAlphaclawVersionService } = loadVersionModule({ execMock });
    const service = createAlphaclawVersionService();

    const result = await service.updateAlphaclaw();

    expect(result.status).toBe(200);
    expect(result.body.ok).toBe(true);
    expect(result.body.restarting).toBe(true);
    expect(result.body.previousVersion).toBeTruthy();
    expect(execMock).toHaveBeenCalledTimes(2);
    expect(execMock).toHaveBeenNthCalledWith(
      1,
      "npm install --omit=dev --prefer-online --package-lock=false",
      expect.objectContaining({
        cwd: expect.stringContaining(path.join(os.tmpdir(), "alphaclaw-update-")),
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
      expect.objectContaining({ timeout: kOpenclawUpdateCopyTimeoutMs }),
      expect.any(Function),
    );
  });

  it("returns 500 when npm install fails", async () => {
    const execMock = vi.fn().mockImplementation((cmd, opts, callback) => {
      callback(
        new Error("npm ERR! network timeout"),
        "",
        "npm ERR! network timeout",
      );
    });
    const { createAlphaclawVersionService } = loadVersionModule({ execMock });
    const service = createAlphaclawVersionService();

    const result = await service.updateAlphaclaw();

    expect(result.status).toBe(500);
    expect(result.body.ok).toBe(false);
    expect(result.body.error).toContain("npm ERR!");
  });

  it("writes update marker to kRootDir on successful update", async () => {
    const execMock = vi.fn().mockImplementation((cmd, opts, callback) => {
      callback(null, "added 1 package", "");
    });
    const writeSpy = vi.spyOn(fs, "writeFileSync");
    const { createAlphaclawVersionService } = loadVersionModule({ execMock });
    const service = createAlphaclawVersionService();

    const result = await service.updateAlphaclaw();

    expect(result.status).toBe(200);
    const markerPath = path.join(kRootDir, ".alphaclaw-update-pending");
    const markerCall = writeSpy.mock.calls.find(
      (call) => call[0] === markerPath,
    );
    expect(markerCall).toBeTruthy();
    const markerData = JSON.parse(markerCall[1]);
    expect(markerData).toHaveProperty("from");
    expect(markerData).toHaveProperty("ts");

    writeSpy.mockRestore();
  });
});
