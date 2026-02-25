const fs = require("fs");
const { OPENCLAW_DIR } = require("../constants");

const registerPairingRoutes = ({ app, clawCmd, isOnboarded, fsModule = fs, openclawDir = OPENCLAW_DIR }) => {
  let pairingCache = { pending: [], ts: 0 };
  const PAIRING_CACHE_TTL = 10000;
  const kCliAutoApproveMarkerPath = `${openclawDir}/.cli-device-auto-approved`;

  const hasCliAutoApproveMarker = () => fsModule.existsSync(kCliAutoApproveMarkerPath);

  const writeCliAutoApproveMarker = () => {
    fsModule.mkdirSync(openclawDir, { recursive: true });
    fsModule.writeFileSync(
      kCliAutoApproveMarkerPath,
      JSON.stringify({ approvedAt: new Date().toISOString() }, null, 2),
    );
  };

  app.get("/api/pairings", async (req, res) => {
    if (Date.now() - pairingCache.ts < PAIRING_CACHE_TTL) {
      return res.json({ pending: pairingCache.pending });
    }

    const pending = [];
    const channels = ["telegram", "discord"];

    for (const ch of channels) {
      try {
        const config = JSON.parse(fs.readFileSync(`${OPENCLAW_DIR}/openclaw.json`, "utf8"));
        if (!config.channels?.[ch]?.enabled) continue;
      } catch {
        continue;
      }

      const result = await clawCmd(`pairing list ${ch}`, { quiet: true });
      if (result.ok && result.stdout) {
        const lines = result.stdout.split("\n").filter((l) => l.trim());
        for (const line of lines) {
          const codeMatch = line.match(/([A-Z0-9]{8})/);
          if (codeMatch) {
            pending.push({
              id: codeMatch[1],
              code: codeMatch[1],
              channel: ch,
            });
          }
        }
      }
    }

    pairingCache = { pending, ts: Date.now() };
    res.json({ pending });
  });

  app.post("/api/pairings/:id/approve", async (req, res) => {
    const channel = req.body.channel || "telegram";
    const result = await clawCmd(`pairing approve ${channel} ${req.params.id}`);
    res.json(result);
  });

  app.post("/api/pairings/:id/reject", async (req, res) => {
    const channel = req.body.channel || "telegram";
    const result = await clawCmd(`pairing reject ${channel} ${req.params.id}`);
    res.json(result);
  });

  let devicePairingCache = { pending: [], ts: 0 };
  const kDevicePairingCacheTtl = 3000;

  app.get("/api/devices", async (req, res) => {
    if (!isOnboarded()) return res.json({ pending: [] });
    if (Date.now() - devicePairingCache.ts < kDevicePairingCacheTtl) {
      return res.json({ pending: devicePairingCache.pending });
    }
    const result = await clawCmd("devices list --json", { quiet: true });
    if (!result.ok) return res.json({ pending: [] });
    try {
      const parsed = JSON.parse(result.stdout);
      const pendingList = Array.isArray(parsed.pending) ? parsed.pending : [];
      let autoApprovedRequestId = null;
      if (!hasCliAutoApproveMarker()) {
        const firstCliPending = pendingList.find((d) => {
          const clientId = String(d.clientId || "").toLowerCase();
          const clientMode = String(d.clientMode || "").toLowerCase();
          return clientId === "cli" || clientMode === "cli";
        });
        const firstCliPendingId = firstCliPending?.requestId || firstCliPending?.id;
        if (firstCliPendingId) {
          console.log(`[wrapper] Auto-approving first CLI device request: ${firstCliPendingId}`);
          const approveResult = await clawCmd(`devices approve ${firstCliPendingId}`, {
            quiet: true,
          });
          if (approveResult.ok) {
            writeCliAutoApproveMarker();
            autoApprovedRequestId = String(firstCliPendingId);
          } else {
            console.log(
              `[wrapper] CLI auto-approve failed: ${(approveResult.stderr || "").slice(0, 200)}`,
            );
          }
        }
      }
      const pending = pendingList
        .filter((d) => String(d.requestId || d.id || "") !== autoApprovedRequestId)
        .map((d) => ({
          id: d.requestId || d.id,
          platform: d.platform || null,
          clientId: d.clientId || null,
          clientMode: d.clientMode || null,
          role: d.role || null,
          scopes: d.scopes || [],
          ts: d.ts || null,
        }));
      devicePairingCache = { pending, ts: Date.now() };
      res.json({ pending });
    } catch {
      res.json({ pending: [] });
    }
  });

  app.post("/api/devices/:id/approve", async (req, res) => {
    const result = await clawCmd(`devices approve ${req.params.id}`);
    devicePairingCache.ts = 0;
    res.json(result);
  });

  app.post("/api/devices/:id/reject", async (req, res) => {
    const result = await clawCmd(`devices reject ${req.params.id}`);
    devicePairingCache.ts = 0;
    res.json(result);
  });
};

module.exports = { registerPairingRoutes };
