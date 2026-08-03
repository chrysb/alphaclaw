const fs = require("fs");
const os = require("os");
const path = require("path");

const {
  resolveImportedConfigPaths,
} = require("../../lib/server/onboarding/import/import-config");

const kTempDirs = [];
const createTempDir = () => {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "alphaclaw-import-config-"));
  kTempDirs.push(tempDir);
  return tempDir;
};
afterEach(() => {
  while (kTempDirs.length > 0) {
    fs.rmSync(kTempDirs.pop(), { recursive: true, force: true });
  }
});

describe("onboarding import-config resolveImportedConfigPaths", () => {
  it("does not walk a $include that traverses outside openclawDir, even if the target exists", () => {
    const openclawDir = createTempDir();
    const outsideDir = createTempDir();

    fs.writeFileSync(
      path.join(outsideDir, "real-config.json"),
      JSON.stringify({ someKey: "someValue" }),
      "utf8",
    );

    const traversal = path
      .relative(openclawDir, path.join(outsideDir, "real-config.json"))
      .split(path.sep)
      .join("/");

    fs.writeFileSync(
      path.join(openclawDir, "openclaw.json"),
      JSON.stringify({ auth: { $include: traversal } }),
      "utf8",
    );

    const configPaths = resolveImportedConfigPaths({ fs, openclawDir });

    expect(configPaths).toEqual([path.join(openclawDir, "openclaw.json")]);
    expect(configPaths).not.toContain(path.join(outsideDir, "real-config.json"));
  });

  it("still follows a legitimate in-directory $include", () => {
    const openclawDir = createTempDir();
    fs.mkdirSync(path.join(openclawDir, "cron"), { recursive: true });
    fs.writeFileSync(
      path.join(openclawDir, "cron", "jobs.json"),
      JSON.stringify({ jobs: [] }),
      "utf8",
    );
    fs.writeFileSync(
      path.join(openclawDir, "openclaw.json"),
      JSON.stringify({ cron: { $include: "cron/jobs.json" } }),
      "utf8",
    );

    const configPaths = resolveImportedConfigPaths({ fs, openclawDir });

    expect(configPaths).toContain(path.join(openclawDir, "cron", "jobs.json"));
  });
});
