const fs = require("fs");
const os = require("os");
const path = require("path");

const {
  resolveWhatsAppCredentialCandidatePaths,
  hasSavedWhatsAppCredentials,
} = require("../../lib/server/agents/shared");

const kTempDirs = [];
const createTempDir = () => {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "alphaclaw-agents-shared-"));
  kTempDirs.push(tempDir);
  return tempDir;
};
afterEach(() => {
  while (kTempDirs.length > 0) {
    fs.rmSync(kTempDirs.pop(), { recursive: true, force: true });
  }
});

describe("agents/shared WhatsApp credential path containment", () => {
  it("never returns a candidate path outside the credentials directory for a traversal-shaped accountId", () => {
    const OPENCLAW_DIR = createTempDir();

    const candidates = resolveWhatsAppCredentialCandidatePaths({
      OPENCLAW_DIR,
      accountId: "../../../../etc/shadow",
    });

    const credentialsDir = path.join(OPENCLAW_DIR, "credentials");
    for (const candidate of candidates) {
      expect(
        candidate === credentialsDir ||
          candidate.startsWith(`${credentialsDir}${path.sep}`),
      ).toBe(true);
    }
  });

  it("does not report a real file outside OPENCLAW_DIR as linked WhatsApp credentials", () => {
    const OPENCLAW_DIR = createTempDir();
    const outsideDir = createTempDir();

    // A real, non-empty file named exactly like what the function looks for
    // (creds.json), sitting outside OPENCLAW_DIR entirely -- stands in for
    // some unrelated real file the accountId traversal happens to reach.
    fs.writeFileSync(path.join(outsideDir, "creds.json"), "root:x:0:0\n", "utf8");

    // accountId such that OPENCLAW_DIR/credentials/whatsapp/<accountId>/creds.json
    // resolves to outsideDir/creds.json.
    const accountId = path
      .relative(path.join(OPENCLAW_DIR, "credentials", "whatsapp"), outsideDir)
      .split(path.sep)
      .join("/");

    const linked = hasSavedWhatsAppCredentials({
      fsImpl: fs,
      OPENCLAW_DIR,
      accountId,
    });

    expect(linked).toBe(false);
  });

  it("still reports linked when real, in-directory WhatsApp credentials exist", () => {
    const OPENCLAW_DIR = createTempDir();
    const credsDir = path.join(OPENCLAW_DIR, "credentials", "whatsapp", "default");
    fs.mkdirSync(credsDir, { recursive: true });
    fs.writeFileSync(path.join(credsDir, "creds.json"), "{}", "utf8");

    const linked = hasSavedWhatsAppCredentials({
      fsImpl: fs,
      OPENCLAW_DIR,
      accountId: "default",
    });

    expect(linked).toBe(true);
  });
});
