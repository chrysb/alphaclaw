const fs = require("fs");

const originalExistsSync = fs.existsSync;
const originalReaddirSync = fs.readdirSync;
const originalReadFileSync = fs.readFileSync;
const { createWatchdogNotifier } = require("../../lib/server/watchdog-notify");

describe("server/watchdog-notify", () => {
  const originalEnv = { ...process.env };

  afterEach(() => {
    fs.existsSync = originalExistsSync;
    fs.readdirSync = originalReaddirSync;
    fs.readFileSync = originalReadFileSync;
    process.env = { ...originalEnv };
  });

  it("delivers whatsapp watchdog notices via clawCmd message action", async () => {
    process.env.WHATSAPP_OWNER_NUMBER = "+15551234567";
    fs.existsSync = vi.fn((targetPath) =>
      String(targetPath || "").endsWith("/credentials"),
    );
    fs.readdirSync = vi.fn((targetPath) => {
      if (String(targetPath || "").endsWith("/credentials")) {
        return ["whatsapp-default-allowFrom.json"];
      }
      return [];
    });
    fs.readFileSync = vi.fn((targetPath) => {
      if (
        String(targetPath || "").endsWith(
          "/credentials/whatsapp-default-allowFrom.json",
        )
      ) {
        return JSON.stringify({ allowFrom: ["15551234567"] });
      }
      return "{}";
    });

    const clawCmd = vi.fn(async () => ({ ok: true, stdout: "sent", stderr: "" }));
    const notifier = createWatchdogNotifier({ clawCmd });

    const result = await notifier.notify("Gateway healthy again");

    expect(result.ok).toBe(true);
    expect(result.sent).toBe(1);
    expect(result.channels.whatsapp.sent).toBe(1);
    expect(clawCmd).toHaveBeenCalledWith(
      expect.stringContaining("message --channel whatsapp"),
      expect.objectContaining({ quiet: true }),
    );
  });
});
