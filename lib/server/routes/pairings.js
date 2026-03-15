const fs = require("fs");
const path = require("path");
const { OPENCLAW_DIR } = require("../constants");
const { buildManagedPaths } = require("../internal-files-migration");
const { parseJsonObjectFromNoisyOutput } = require("../utils/json");
const { quoteShellArg } = require("../utils/shell");

const kAllowedPairingChannels = new Set(["telegram", "discord", "slack"]);
const kSafePairingArgPattern = /^[\w\-:.]+$/;
const quoteCliArg = (value) => quoteShellArg(value, { strategy: "single" });

const resolvePairingStorePath = ({ openclawDir, channel }) =>
  path.join(openclawDir, "credentials", `${String(channel).trim().toLowerCase()}-pairing.json`);

const readPairingStore = ({ fsModule, filePath }) => {
  try {
    const raw = fsModule.readFileSync(filePath, "utf8");
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed?.requests) ? parsed.requests : [];
  } catch {
    return [];
  }
};

const writePairingStore = ({ fsModule, filePath, requests }) => {
  fsModule.mkdirSync(path.dirname(filePath), { recursive: true });
  fsModule.writeFileSync(filePath, JSON.stringify({ version: 1, requests }, null, 2));
};

const removeRequestFromPairingStore = ({ fsModule, openclawDir, channel, code, accountId }) => {
  const filePath = resolvePairingStorePath({ openclawDir, channel });
  const requests = readPairingStore({ fsModule, filePath });
  const normalizedCode = String(code || "").trim().toUpperCase();
  const normalizedAccountId = String(accountId || "").trim().toLowerCase();
  const nextRequests = requests.filter((entry) => {
    const entryCode = String(entry?.code || "").trim().toUpperCase();
    if (entryCode !== normalizedCode) return true;
    if (normalizedAccountId) {
      const entryAccountId = String(entry?.meta?.accountId || "").trim().toLowerCase();
      return entryAccountId !== normalizedAccountId;
    }
    return false;
  });
  if (nextRequests.length !== requests.length) {
    writePairingStore({ fsModule, filePath, requests: nextRequests });
    return true;
  }
  return false;
};

const removeAccountRequestsFromPairingStore = ({ fsModule, openclawDir, channel, accountId }) => {
  const filePath = resolvePairingStorePath({ openclawDir, channel });
  const requests = readPairingStore({ fsModule, filePath });
  if (requests.length === 0) return;
  const normalizedAccountId = String(accountId || "").trim().toLowerCase() || "default";
  const nextRequests = requests.filter((entry) => {
    const entryAccountId = String(entry?.meta?.accountId || "").trim().toLowerCase() || "default";
    return entryAccountId !== normalizedAccountId;
  });
  if (nextRequests.length !== requests.length) {
    writePairingStore({ fsModule, filePath, requests: nextRequests });
  }
};

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
    const channels = ["telegram", "discord", "slack"];

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
    const channel = String(req.body?.channel || "telegram")
      .trim()
      .toLowerCase();
    const accountId = String(req.body?.accountId || "").trim();
    const pairingId = String(req.params.id || "").trim();
    if (!kAllowedPairingChannels.has(channel)) {
      return res.status(400).json({
        ok: false,
        error: `Unsupported pairing channel "${channel}"`,
      });
    }
    if (!pairingId || !kSafePairingArgPattern.test(pairingId)) {
      return res.status(400).json({
        ok: false,
        error: "Invalid pairing id",
      });
    }
    if (accountId && !kSafePairingArgPattern.test(accountId)) {
      return res.status(400).json({
        ok: false,
        error: "Invalid account id",
      });
    }
    const approveCmd = accountId
      ? `pairing approve --channel ${quoteCliArg(channel)} --account ${quoteCliArg(accountId)} ${quoteCliArg(pairingId)}`
      : `pairing approve ${quoteCliArg(channel)} ${quoteCliArg(pairingId)}`;
    const result = await clawCmd(approveCmd);
    res.json(result);
  });

  app.post("/api/pairings/:id/reject", (req, res) => {
    const channel = String(req.body.channel || "telegram").trim();
    const accountId = String(req.body?.accountId || "").trim();
    try {
      const removed = removeRequestFromPairingStore({
        fsModule,
        openclawDir,
        channel,
        code: req.params.id,
        accountId,
      });
      pairingCache.ts = 0;
      if (removed) {
        console.log(`[alphaclaw] Rejected pairing request ${req.params.id} for ${channel}${accountId ? `/${accountId}` : ""}`);
        return res.json({ ok: true, removed: true });
      }
      return res.status(404).json({
        ok: false,
        removed: false,
        error: "Pairing request not found",
      });
    } catch (error) {
      console.error(`[alphaclaw] Pairing reject error: ${error.message}`);
      res.status(500).json({ ok: false, error: error.message });
    }
  });

  let devicePairingCache = { pending: [], cliAutoApproveComplete: false, ts: 0 };
  const kDevicePairingCacheTtl = 3000;

  app.get("/api/devices", async (req, res) => {
    if (!isOnboarded()) {
      return res.json({ pending: [], cliAutoApproveComplete: hasCliAutoApproveMarker() });
    }
    if (Date.now() - devicePairingCache.ts < kDevicePairingCacheTtl) {
      return res.json({
        pending: devicePairingCache.pending,
        cliAutoApproveComplete: devicePairingCache.cliAutoApproveComplete,
      });
    }
    const result = await clawCmd("devices list --json", { quiet: true });
    if (!result.ok) {
      return res.json({ pending: [], cliAutoApproveComplete: hasCliAutoApproveMarker() });
    }
    try {
      const parsed = parseJsonObjectFromNoisyOutput(result.stdout);
      const pendingList = Array.isArray(parsed?.pending) ? parsed.pending : [];
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
      const cliAutoApproveComplete = hasCliAutoApproveMarker();
      devicePairingCache = { pending, cliAutoApproveComplete, ts: Date.now() };
      res.json({ pending, cliAutoApproveComplete });
    } catch {
      res.json({ pending: [], cliAutoApproveComplete: hasCliAutoApproveMarker() });
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

module.exports = {
  registerPairingRoutes,
  removeAccountRequestsFromPairingStore,
};
