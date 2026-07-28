const fs = require("fs");
const os = require("os");
const path = require("path");
const { kRootDir } = require("../../lib/server/constants");
const {
  installHourlyGitSyncCron,
} = require("../../lib/server/onboarding/cron");

const kSystemCronPath = "/etc/cron.d/openclaw-hourly-sync";

const createMockFs = () => {
  const writes = {};
  return {
    writes,
    fs: {
      mkdirSync: (dir, opts) => fs.mkdirSync(dir, opts),
      writeFileSync: (target, data, opts) => {
        const t = String(target || "");
        writes[t] = String(data);
        if (t.startsWith("/etc/cron.d/")) return;
        return fs.writeFileSync(target, data, opts);
      },
      readFileSync: (...args) => fs.readFileSync(...args),
    },
  };
};

describe("server/onboarding/cron", () => {
  it("writes ALPHACLAW_ROOT_DIR into the generated system cron file", async () => {
    const openclawDir = fs.mkdtempSync(
      path.join(os.tmpdir(), "alphaclaw-onboard-cron-"),
    );
    const { fs: mockFs, writes } = createMockFs();

    const installed = await installHourlyGitSyncCron({
      fs: mockFs,
      openclawDir,
    });

    expect(installed).toBe(true);
    const cronContent = writes[kSystemCronPath];
    expect(cronContent).toBeDefined();
    // cron applies no environment beyond what this file declares; without
    // ALPHACLAW_ROOT_DIR the CLI resolves os.homedir()/.alphaclaw and the
    // hourly sync no-ops against a phantom install (issue #105).
    expect(cronContent).toContain(`ALPHACLAW_ROOT_DIR=${kRootDir}`);
    expect(cronContent).toContain("SHELL=/bin/bash");
    expect(cronContent).toMatch(/^0 \* \* \* \* root bash /m);
    // /etc/cron.d files without a trailing newline are ignored by cron.
    expect(cronContent.endsWith("\n")).toBe(true);
  });
});
