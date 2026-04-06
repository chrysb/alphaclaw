const fs = require("fs");
const path = require("path");
const https = require("https");
const { EventEmitter } = require("events");

const { kNpmPackageRoot, kRootDir } = require("../../lib/server/constants");
const modulePath = require.resolve("../../lib/server/alphaclaw-version");
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

const createDeferredHttpsGet = (responseJson) => {
  const pending = [];
  const httpsGetMock = vi.fn((url, opts, callback) => {
    const res = new EventEmitter();
    res.statusCode = 200;
    pending.push(() => {
      callback(res);
      process.nextTick(() => {
        res.emit("data", JSON.stringify(responseJson));
        res.emit("end");
      });
    });
    const req = new EventEmitter();
    req.on = vi.fn().mockReturnThis();
    return req;
  });
  return { httpsGetMock, pending };
};

const loadVersionModule = ({ httpsGetMock } = {}) => {
  if (httpsGetMock) https.get = httpsGetMock;
  delete require.cache[modulePath];
  return require(modulePath);
};

describe("server/alphaclaw-version", () => {
  afterEach(() => {
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
    const { httpsGetMock, pending } = createDeferredHttpsGet({
      "dist-tags": { latest: "99.0.0" },
    });
    const { createAlphaclawVersionService } = loadVersionModule({
      httpsGetMock,
    });
    const service = createAlphaclawVersionService();

    const firstPromise = service.updateAlphaclaw();
    await new Promise((resolve) => setImmediate(resolve));

    const secondResult = await service.updateAlphaclaw();
    expect(secondResult.status).toBe(409);
    expect(secondResult.body).toEqual({
      ok: false,
      error: "AlphaClaw update already in progress",
    });

    pending[0]();
    await firstPromise;
  });

  it("returns successful update result with restarting flag and exact target version", async () => {
    const httpsGetMock = createMockHttpsGet({
      "dist-tags": { latest: "99.0.0" },
    });
    const { createAlphaclawVersionService } = loadVersionModule({
      httpsGetMock,
    });
    const service = createAlphaclawVersionService();

    const result = await service.updateAlphaclaw();

    expect(result.status).toBe(200);
    expect(result.body.ok).toBe(true);
    expect(result.body.restarting).toBe(true);
    expect(result.body.previousVersion).toBeTruthy();
    expect(result.body.targetVersion).toBe("99.0.0");
  });

  it("falls back to latest marker when the registry lookup fails", async () => {
    const httpsGetMock = vi.fn((url, opts, callback) => {
      const req = new EventEmitter();
      req.on = vi.fn().mockImplementation((event, handler) => {
        if (event === "error") {
          process.nextTick(() => handler(new Error("network timeout")));
        }
        return req;
      });
      return req;
    });
    const writeSpy = vi.spyOn(fs, "writeFileSync");
    const { createAlphaclawVersionService } = loadVersionModule({
      httpsGetMock,
    });
    const service = createAlphaclawVersionService();

    const result = await service.updateAlphaclaw();

    expect(result.status).toBe(200);
    expect(result.body.ok).toBe(true);
    expect(result.body.targetVersion).toBe(null);
    const markerPath = path.join(kRootDir, ".alphaclaw-update-pending");
    const markerCall = writeSpy.mock.calls.find((call) => call[0] === markerPath);
    expect(markerCall).toBeTruthy();
    expect(JSON.parse(markerCall[1])).toMatchObject({
      spec: "@chrysb/alphaclaw@latest",
      to: "latest",
    });

    writeSpy.mockRestore();
  });

  it("returns 500 when it cannot write the pending update marker", async () => {
    const httpsGetMock = createMockHttpsGet({
      "dist-tags": { latest: "99.0.0" },
    });
    const writeSpy = vi.spyOn(fs, "writeFileSync").mockImplementation((targetPath) => {
      if (targetPath === path.join(kRootDir, ".alphaclaw-update-pending")) {
        throw new Error("disk full");
      }
      return undefined;
    });
    const { createAlphaclawVersionService } = loadVersionModule({
      httpsGetMock,
    });
    const service = createAlphaclawVersionService();

    const result = await service.updateAlphaclaw();

    expect(result.status).toBe(500);
    expect(result.body.ok).toBe(false);
    expect(result.body.error).toContain("disk full");

    writeSpy.mockRestore();
  });

  it("writes update marker to kRootDir on successful update", async () => {
    const httpsGetMock = createMockHttpsGet({
      "dist-tags": { latest: "99.0.0" },
    });
    const writeSpy = vi.spyOn(fs, "writeFileSync");
    const { createAlphaclawVersionService } = loadVersionModule({
      httpsGetMock,
    });
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
    expect(markerData).toHaveProperty("to", "99.0.0");
    expect(markerData).toHaveProperty("spec", "@chrysb/alphaclaw@99.0.0");
    expect(markerData).toHaveProperty("ts");

    writeSpy.mockRestore();
  });
});
