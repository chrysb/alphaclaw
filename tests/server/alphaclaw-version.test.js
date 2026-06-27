const childProcess = require("child_process");
const fs = require("fs");
const os = require("os");
const path = require("path");

const {
  kNpmPackageRoot,
  kOpenclawUpdateCopyTimeoutMs,
  kRootDir,
} = require("../../lib/server/constants");
const modulePath = require.resolve("../../lib/server/alphaclaw-version");
const originalExec = childProcess.exec;

const createFetchResponse = ({ ok = true, status = 200, body = {} } = {}) => ({
  ok,
  status,
  text: vi.fn(async () =>
    typeof body === "string" ? body : JSON.stringify(body),
  ),
});

const createFsMock = (overrides = {}) => ({
  ...fs,
  writeFileSync: vi.fn(),
  ...overrides,
});

const loadVersionModule = ({ execMock } = {}) => {
  if (execMock) childProcess.exec = execMock;
  delete require.cache[modulePath];
  return require(modulePath);
};

const createService = ({
  env = {},
  readOpenclawVersion = () => "2026.4.1",
  fetchMock = vi.fn(),
  execMock = vi.fn(),
  fsImpl = fs,
} = {}) => {
  const { createAlphaclawVersionService } = loadVersionModule({ execMock });
  const service = createAlphaclawVersionService({
    env,
    readOpenclawVersion,
    fetchImpl: fetchMock,
    fsImpl,
  });
  return { service, fetchMock, execMock };
};

describe("server/alphaclaw-version", () => {
  afterEach(() => {
    childProcess.exec = originalExec;
    delete require.cache[modulePath];
  });

  it("reads current version from package.json", () => {
    const { service } = createService();
    const version = service.readAlphaclawVersion();

    const expectedPkg = JSON.parse(
      fs.readFileSync(path.join(kNpmPackageRoot, "package.json"), "utf8"),
    );
    expect(version).toBe(expectedPkg.version);
  });

  it("returns local self-update status from npm", async () => {
    const fetchMock = vi.fn(async (url) => {
      expect(url).toBe("https://registry.npmjs.org/@chrysb%2falphaclaw");
      return createFetchResponse({
        body: {
          "dist-tags": { latest: "99.0.0" },
        },
      });
    });
    const { service } = createService({
      env: {},
      readOpenclawVersion: () => "2026.4.10",
      fetchMock,
      fsImpl: { ...fs, existsSync: vi.fn(() => false) },
    });

    const status = await service.getVersionStatus(false);

    expect(status).toEqual(
      expect.objectContaining({
        ok: true,
        currentVersion: expect.any(String),
        currentOpenclawVersion: "2026.4.10",
        latestVersion: "99.0.0",
        hasUpdate: true,
        updateStrategy: expect.objectContaining({
          action: "self-update",
          provider: "self-hosted",
        }),
      }),
    );
  });

  it("returns template-managed status for railway deployments", async () => {
    const fetchMock = vi.fn(async (url) => {
      expect(url).toContain(
        "https://raw.githubusercontent.com/chrysb/openclaw-railway-template/main/package.json",
      );
      return createFetchResponse({
        body: {
          dependencies: {
            "@chrysb/alphaclaw": "0.8.10",
            openclaw: "2026.4.10",
          },
        },
      });
    });
    const { service } = createService({
      env: { RAILWAY_ENVIRONMENT: "production" },
      readOpenclawVersion: () => "2026.4.5",
      fetchMock,
    });

    const status = await service.getVersionStatus(true);

    expect(status).toEqual(
      expect.objectContaining({
        ok: true,
        latestVersion: "0.8.10",
        latestOpenclawVersion: "2026.4.10",
        hasUpdate: true,
        updateStrategy: expect.objectContaining({
          action: "instructions",
          provider: "railway",
          templateRepoUrl:
            "https://github.com/chrysb/openclaw-railway-template.git",
        }),
      }),
    );
  });

  it("derives the OpenClaw version from the template-pinned AlphaClaw package when the template omits a direct openclaw pin", async () => {
    const fetchMock = vi.fn(async (url) => {
      if (
        String(url).includes(
          "https://raw.githubusercontent.com/chrysb/openclaw-railway-template/main/package.json",
        )
      ) {
        return createFetchResponse({
          body: {
            dependencies: {
              "@chrysb/alphaclaw": "0.9.2",
            },
          },
        });
      }

      expect(url).toBe("https://registry.npmjs.org/@chrysb%2falphaclaw");
      return createFetchResponse({
        body: {
          "dist-tags": { latest: "0.9.6" },
          versions: {
            "0.9.2": {
              dependencies: {
                openclaw: "2026.4.11",
              },
            },
            "0.9.6": {
              dependencies: {
                openclaw: "2026.4.14",
              },
            },
          },
        },
      });
    });
    const { service } = createService({
      env: { RAILWAY_ENVIRONMENT: "production" },
      readOpenclawVersion: () => "2026.4.5",
      fetchMock,
    });

    const status = await service.getVersionStatus(true);

    expect(status).toEqual(
      expect.objectContaining({
        ok: true,
        latestVersion: "0.9.2",
        latestOpenclawVersion: "2026.4.11",
      }),
    );
  });

  it("includes a direct Railway dashboard link when project metadata is available", async () => {
    const fetchMock = vi.fn(async () =>
      createFetchResponse({
        body: {
          dependencies: {
            "@chrysb/alphaclaw": "0.8.10",
            openclaw: "2026.4.10",
          },
        },
      }),
    );
    const { service } = createService({
      env: {
        RAILWAY_ENVIRONMENT: "production",
        RAILWAY_PROJECT_ID: "582da512-0510-4844-9ffb-efe89b88e1e9",
        RAILWAY_SERVICE_ID: "b3ea8fbd-9727-4b5c-adbe-8a3a8ab2dd2c",
        RAILWAY_ENVIRONMENT_ID: "181e3f67-233a-41b9-9485-f64235eb764d",
      },
      fetchMock,
    });

    const status = await service.getVersionStatus(true);

    expect(status.updateStrategy).toEqual(
      expect.objectContaining({
        provider: "railway",
        primaryActionLabel: "Update on Railway",
        primaryActionUrl:
          "https://railway.com/project/582da512-0510-4844-9ffb-efe89b88e1e9/service/b3ea8fbd-9727-4b5c-adbe-8a3a8ab2dd2c?environmentId=181e3f67-233a-41b9-9485-f64235eb764d",
      }),
    );
  });

  it("includes a direct Render dashboard link when service metadata is available", async () => {
    const fetchMock = vi.fn(async () =>
      createFetchResponse({
        body: {
          dependencies: {
            "@chrysb/alphaclaw": "0.8.10",
            openclaw: "2026.4.10",
          },
        },
      }),
    );
    const { service } = createService({
      env: {
        RENDER: "true",
        RENDER_SERVICE_ID: "srv-d776lrvpm1nc73e08c9g",
      },
      fetchMock,
    });

    const status = await service.getVersionStatus(true);

    expect(status.updateStrategy).toEqual(
      expect.objectContaining({
        provider: "render",
        primaryActionLabel: "Update on Render",
        primaryActionUrl:
          "https://dashboard.render.com/web/srv-d776lrvpm1nc73e08c9g",
      }),
    );
  });

  it("triggers the managed deployment bridge for apex containers", async () => {
    const fetchMock = vi.fn(async (url, options = {}) => {
      if (String(url).includes("raw.githubusercontent.com")) {
        return createFetchResponse({
          body: {
            dependencies: {
              "@chrysb/alphaclaw": "0.8.7",
              openclaw: "2026.4.10",
            },
          },
        });
      }
      if (String(url).includes("/commits/main")) {
        return createFetchResponse({
          body: { sha: "aded043defd05bba6787bca75ac6ed8dffd43c6e" },
        });
      }
      expect(url).toBe("http://host.docker.internal:3180/update");
      expect(options.method).toBe("POST");
      expect(options.headers.Authorization).toBe("Bearer bridge-token");
      expect(JSON.parse(options.body)).toEqual({
        repo: "https://github.com/chrysb/openclaw-apex-template.git",
        ref: "aded043defd05bba6787bca75ac6ed8dffd43c6e",
        alphaclawVersion: "0.8.7",
        openclawVersion: "2026.4.10",
      });
      return createFetchResponse({
        body: { ok: true, phase: "queued", noop: false },
      });
    });
    const { service } = createService({
      env: {
        ALPHACLAW_MANAGED_UPDATE_URL: "http://host.docker.internal:3180/update",
        ALPHACLAW_MANAGED_UPDATE_TOKEN: "bridge-token",
        ALPHACLAW_TEMPLATE_REPO_URL:
          "https://github.com/chrysb/openclaw-apex-template.git",
      },
      readOpenclawVersion: () => "2026.4.5",
      fetchMock,
    });

    const result = await service.updateAlphaclaw();

    expect(result.status).toBe(200);
    expect(result.body).toEqual(
      expect.objectContaining({
        ok: true,
        managedUpdate: true,
        restarting: true,
        latestVersion: "0.8.7",
        latestOpenclawVersion: "2026.4.10",
      }),
    );
  });

  it("returns Apex migration instructions when the deployment provider is apex but the bridge is missing", async () => {
    const fetchMock = vi.fn(async (url) => {
      if (String(url).includes("raw.githubusercontent.com")) {
        return createFetchResponse({
          body: {
            dependencies: {
              "@chrysb/alphaclaw": "0.8.7",
              openclaw: "2026.4.10",
            },
          },
        });
      }
      if (String(url).includes("/commits/main")) {
        return createFetchResponse({
          body: { sha: "aded043defd05bba6787bca75ac6ed8dffd43c6e" },
        });
      }
      throw new Error(`Unexpected fetch call: ${String(url)}`);
    });
    const { service } = createService({
      env: {
        ALPHACLAW_DEPLOYMENT_PROVIDER: "apex",
        ALPHACLAW_TEMPLATE_REPO_URL:
          "https://github.com/chrysb/openclaw-apex-template.git",
      },
      fetchMock,
    });

    const status = await service.getVersionStatus(true);

    expect(status.updateStrategy).toEqual(
      expect.objectContaining({
        provider: "apex",
        action: "instructions",
        primaryActionLabel: "Done",
      }),
    );

    const result = await service.updateAlphaclaw();
    expect(result.status).toBe(409);
    expect(result.body.updateStrategy).toEqual(
      expect.objectContaining({
        provider: "apex",
        action: "instructions",
        primaryActionLabel: "Done",
      }),
    );
  });

  it("returns instructions-only rejection for railway deployments", async () => {
    const fetchMock = vi.fn(async () =>
      createFetchResponse({
        body: {
          dependencies: {
            "@chrysb/alphaclaw": "0.8.10",
            openclaw: "2026.4.10",
          },
        },
      }),
    );
    const { service } = createService({
      env: { RAILWAY_ENVIRONMENT: "production" },
      fetchMock,
    });

    const result = await service.updateAlphaclaw();

    expect(result.status).toBe(409);
    expect(result.body.ok).toBe(false);
    expect(result.body.updateStrategy).toEqual(
      expect.objectContaining({
        provider: "railway",
        action: "instructions",
      }),
    );
  });

  it("returns 409 while another self-update is in progress", async () => {
    const callbacks = [];
    const execMock = vi.fn().mockImplementation((cmd, opts, callback) => {
      callbacks.push(callback);
    });
    const fetchMock = vi.fn(async () =>
      createFetchResponse({
        body: {
          "dist-tags": { latest: "99.0.0" },
        },
      }),
    );
    const { service } = createService({
      fetchMock,
      execMock,
      fsImpl: createFsMock({ existsSync: vi.fn(() => false) }),
    });

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

  it("returns successful self-update result with restarting flag", async () => {
    const execMock = vi.fn().mockImplementation((cmd, opts, callback) => {
      callback(null, "added 1 package", "");
    });
    const { service } = createService({
      execMock,
      fetchMock: vi.fn(),
      fsImpl: createFsMock({ existsSync: vi.fn(() => false) }),
    });

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
    const { service } = createService({
      execMock,
      fsImpl: { ...fs, existsSync: vi.fn(() => false) },
    });

    const result = await service.updateAlphaclaw();

    expect(result.status).toBe(500);
    expect(result.body.ok).toBe(false);
    expect(result.body.error).toContain("npm ERR!");
  });

  it("writes update marker to kRootDir on successful self-update", async () => {
    const execMock = vi.fn().mockImplementation((cmd, opts, callback) => {
      callback(null, "added 1 package", "");
    });
    const fsMock = createFsMock({ existsSync: vi.fn(() => false) });
    const { service } = createService({
      execMock,
      fsImpl: fsMock,
    });

    const result = await service.updateAlphaclaw();

    expect(result.status).toBe(200);
    const markerPath = path.join(kRootDir, ".alphaclaw-update-pending");
    const markerCall = fsMock.writeFileSync.mock.calls.find(
      (call) => call[0] === markerPath,
    );
    expect(markerCall).toBeTruthy();
    const markerData = JSON.parse(markerCall[1]);
    expect(markerData).toHaveProperty("from");
    expect(markerData).toHaveProperty("ts");
  });
});
