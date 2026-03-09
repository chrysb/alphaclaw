const fs = require("fs");
const { OPENCLAW_DIR } = require("../constants");
const { buildManagedPaths } = require("../internal-files-migration");
const { parseJsonObjectFromNoisyOutput } = require("../utils/json");

const registerPairingRoutes = ({ app, clawCmd, isOnboarded, fsModule = fs, openclawDir = OPENCLAW_DIR }) => {
  let pairingCache = { pending: [], ts: 0 };
  const PAIRING_CACHE_TTL = 10000;
  const {
    cliDeviceAutoApprovedPath: kCliAutoApproveMarkerPath,
    internalDir: kManagedFilesDir,
  } = buildManagedPaths({
    openclawDir,
  });

  const hasCliAutoApproveMarker = () => fsModule.existsSync(kCliAutoApproveMarkerPath);

  const writeCliAutoApproveMarker = () => {
    fsModule.mkdirSync(kManagedFilesDir, { recursive: true });
    fsModule.writeFileSync(
      kCliAutoApproveMarkerPath,
      JSON.stringify({ approvedAt: new Date().toISOString() }, null, 2),
    );
  };

  const parsePendingPairings = (stdout, channel) => {
    const parsed = parseJsonObjectFromNoisyOutput(stdout) || {};
    const requestLists = [
      ...(Array.isArray(parsed?.requests) ? [parsed.requests] : []),
      ...(Array.isArray(parsed?.pending) ? [parsed.pending] : []),
    ];
    return requestLists
      .flat()
      .map((entry) => {
        const code = String(entry?.code || entry?.pairingCode || "").trim().toUpperCase();
        if (!code) return null;
        return {
          id: code,
          code,
          channel: String(channel || "").trim(),
          accountId:
            String(entry?.meta?.accountId || entry?.accountId || "").trim() || "default",
          requesterId: String(entry?.id || entry?.requesterId || "").trim(),
        };
      })
      .filter(Boolean);
  };

  app.get("/api/pairings", async (req, res) => {
    if (Date.now() - pairingCache.ts < PAIRING_CACHE_TTL) {
      return res.json({ pending: pairingCache.pending });
    }

    const pending = [];
    const channels = ["telegram", "discord"];

    for (const ch of channels) {
      try {
        const config = JSON.parse(
          fsModule.readFileSync(`${openclawDir}/openclaw.json`, "utf8"),
        );
        if (!config.channels?.[ch]?.enabled) continue;
      } catch {
        continue;
      }

      const result = await clawCmd(`pairing list --channel ${ch} --json`, { quiet: true });
      if (result.ok && result.stdout) {
        try {
          pending.push(...parsePendingPairings(result.stdout, ch));
        } catch {
          // Ignore malformed output for a single channel and keep the rest of the response.
        }
      }
    }

    pairingCache = { pending, ts: Date.now() };
    res.json({ pending });
  });

  app.post("/api/pairings/:id/approve", async (req, res) => {
    const channel = req.body.channel || "telegram";
    const accountId = String(req.body?.accountId || "").trim();
    const approveCmd = accountId
      ? `pairing approve --channel ${channel} --account ${accountId} ${req.params.id}`
      : `pairing approve ${channel} ${req.params.id}`;
    const result = await clawCmd(approveCmd);
    res.json(result);
  });

  app.post("/api/pairings/:id/reject", async (req, res) => {
    const channel = req.body.channel || "telegram";
    const accountId = String(req.body?.accountId || "").trim();
    const rejectCmd = accountId
      ? `pairing reject --channel ${channel} --account ${accountId} ${req.params.id}`
      : `pairing reject ${channel} ${req.params.id}`;
    const result = await clawCmd(rejectCmd);
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
          console.log(`[alphaclaw] Auto-approving first CLI device request: ${firstCliPendingId}`);
          const approveResult = await clawCmd(`devices approve ${firstCliPendingId}`, {
            quiet: true,
          });
          if (approveResult.ok) {
            writeCliAutoApproveMarker();
            autoApprovedRequestId = String(firstCliPendingId);
          } else {
            console.log(
              `[alphaclaw] CLI auto-approve failed: ${(approveResult.stderr || "").slice(0, 200)}`,
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
