const path = require("path");
const os = require("os");
const express = require("express");
const request = require("supertest");

// The real scanWorkspace always returns gatewayConfig.files as an array, so
// the ["openclaw.json"] fallback in the import apply route can only be
// exercised by swapping the scanner export before the routes module captures
// it at require time.
const scannerModule = require("../../lib/server/onboarding/import/import-scanner");
const kRealScanWorkspace = scannerModule.scanWorkspace;

const kStubbedScan = {
  hasOpenclawSetup: true,
  isEmpty: false,
  sourceLayout: {
    kind: "full-openclaw-root",
    supported: true,
    promoteSourceSubdir: "",
  },
  gatewayConfig: { found: true, files: undefined },
  envFiles: { found: false, files: [] },
};

scannerModule.scanWorkspace = () => JSON.parse(JSON.stringify(kStubbedScan));

const {
  registerOnboardingRoutes,
} = require("../../lib/server/routes/onboarding");

afterAll(() => {
  scannerModule.scanWorkspace = kRealScanWorkspace;
});

describe("server/routes/onboarding import apply config-file fallback", () => {
  it("falls back to openclaw.json when the scan omits config file arrays", async () => {
    const tempDir = path.join(os.tmpdir(), "alphaclaw-import-fallback");
    const configPath = path.join(tempDir, "openclaw.json");
    const files = new Map([[configPath, JSON.stringify({ channels: {} })]]);
    const directories = new Set([tempDir]);
    const openclawDir = "/tmp/openclaw-fallback/.openclaw";

    const mockFs = {
      existsSync: vi.fn(
        (targetPath) => directories.has(targetPath) || files.has(targetPath),
      ),
      statSync: vi.fn((targetPath) => {
        if (directories.has(targetPath)) {
          return { isFile: () => false, isDirectory: () => true };
        }
        if (files.has(targetPath)) {
          return { isFile: () => true, isDirectory: () => false };
        }
        throw Object.assign(new Error("ENOENT"), { code: "ENOENT" });
      }),
      readdirSync: vi.fn((targetPath) =>
        targetPath === tempDir
          ? [{ name: "openclaw.json", isFile: () => true, isDirectory: () => false }]
          : [],
      ),
      readFileSync: vi.fn((targetPath) => {
        if (files.has(targetPath)) return files.get(targetPath);
        throw Object.assign(new Error("ENOENT"), { code: "ENOENT" });
      }),
      writeFileSync: vi.fn((targetPath, contents) => {
        files.set(targetPath, String(contents));
      }),
      renameSync: vi.fn((sourcePath, targetPath) => {
        directories.delete(sourcePath);
        directories.add(targetPath);
        for (const [filePath, contents] of [...files.entries()]) {
          if (!filePath.startsWith(`${sourcePath}/`)) continue;
          files.delete(filePath);
          files.set(`${targetPath}${filePath.slice(sourcePath.length)}`, contents);
        }
      }),
      mkdirSync: vi.fn(),
      rmSync: vi.fn(),
      copyFileSync: vi.fn(),
    };

    const app = express();
    app.use(express.json());
    registerOnboardingRoutes({
      app,
      fs: mockFs,
      constants: {
        OPENCLAW_DIR: openclawDir,
        WORKSPACE_DIR: path.join(openclawDir, "workspace"),
        kOnboardingMarkerPath: "/tmp/openclaw-fallback/onboarded.json",
        kSystemVars: new Set(),
      },
      shellCmd: vi.fn(async () => ""),
      gatewayEnv: vi.fn(() => ({})),
      readEnvFile: vi.fn(() => []),
      writeEnvFile: vi.fn(),
      reloadEnv: vi.fn(),
      isOnboarded: vi.fn(() => false),
      resolveGithubRepoUrl: vi.fn((value) => value),
      resolveModelProvider: vi.fn(() => "openai"),
      hasCodexOauthProfile: vi.fn(() => false),
      authProfiles: {},
      ensureGatewayProxyConfig: vi.fn(),
      getBaseUrl: vi.fn(() => "https://example.com"),
      runOnboardedBootSequence: vi.fn(),
    });

    const res = await request(app).post("/api/onboard/import/apply").send({
      tempDir,
      approvedSecrets: [],
      skipSecretExtraction: true,
    });

    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
    // The fallback config list probed the temp dir for openclaw.json.
    expect(mockFs.existsSync).toHaveBeenCalledWith(configPath);
    expect(res.body.sourceLayout.kind).toBe("full-openclaw-root");
  });
});
