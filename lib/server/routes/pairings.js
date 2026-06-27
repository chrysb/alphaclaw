const fs = require("fs");
const path = require("path");
const { OPENCLAW_DIR } = require("../constants");
const { buildManagedPaths } = require("../internal-files-migration");
const { readOpenclawConfig } = require("../openclaw-config");
const { parseJsonObjectFromNoisyOutput } = require("../utils/json");
const { quoteShellArg } = require("../utils/shell");

const kAllowedPairingChannels = new Set(["telegram", "discord", "slack", "whatsapp"]);
const kSafePairingArgPattern = /^[\w\-:.]+$/;
const kDevicesListCliTimeoutMs = 5000;
const kPairingRequestTtlMs = 60 * 60 * 1000;
const kDeviceApprovalCallerScopes = [
  "operator.admin",
  "operator.read",
  "operator.write",
  "operator.approvals",
  "operator.pairing",
  "operator.talk.secrets",
];
const quoteCliArg = (value) => quoteShellArg(value, { strategy: "single" });

let deviceBootstrapModulePromise = null;

const loadDeviceBootstrapModule = async () => {
  deviceBootstrapModulePromise ||= import("openclaw/plugin-sdk/device-bootstrap");
  return deviceBootstrapModulePromise;
};

const defaultApproveDevicePairingDirect = async (requestId, options, baseDir) => {
  const mod = await loadDeviceBootstrapModule();
  if (typeof mod.approveDevicePairing !== "function") {
    throw new Error("OpenClaw device approval helper is unavailable");
  }
  return mod.approveDevicePairing(requestId, options, baseDir);
};

const formatDevicePairingForbiddenMessage = (result) => {
  switch (result?.reason) {
    case "caller-scopes-required":
      return `missing scope: ${result.scope || "callerScopes-required"}`;
    case "caller-missing-scope":
      return `missing scope: ${result.scope || "unknown"}`;
    case "scope-outside-requested-roles":
      return `invalid scope for requested roles: ${result.scope || "unknown"}`;
    case "bootstrap-role-not-allowed":
      return `bootstrap profile does not allow role: ${result.role || "unknown"}`;
    case "bootstrap-scope-not-allowed":
      return `bootstrap profile does not allow scope: ${result.scope || "unknown"}`;
    default:
      return "Device pairing approval forbidden";
  }
};

const redactApprovedDevice = (device) => {
  if (!device || typeof device !== "object") return null;
  const safeDevice = { ...device };
  delete safeDevice.publicKey;
  delete safeDevice.tokens;
  return safeDevice;
};

const normalizeDeviceApprovalResult = (approval, requestId) => {
  if (approval?.status === "approved") {
    return {
      ok: true,
      requestId: approval.requestId || requestId,
      device: redactApprovedDevice(approval.device),
    };
  }
  if (approval?.status === "forbidden") {
    return {
      ok: false,
      statusCode: 403,
      error: formatDevicePairingForbiddenMessage(approval),
    };
  }
  return {
    ok: false,
    statusCode: 404,
    error: "Device pairing request not found",
  };
};

const toHttpDeviceApprovalPayload = (result) => {
  const { statusCode, ...payload } = result || {};
  return payload;
};

const isValidDeviceRequestId = (value) => {
  const requestId = String(value || "").trim();
  return Boolean(requestId && kSafePairingArgPattern.test(requestId));
};

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

const normalizePairingCode = (value) =>
  String(value || "")
    .trim()
    .toUpperCase();

const normalizePairingAccountId = (value) => String(value || "").trim() || "default";

const parseTimestampMs = (value) => {
  const parsed = Date.parse(String(value || "").trim());
  return Number.isFinite(parsed) ? parsed : null;
};

const mapPairingStoreEntry = ({ entry, channel, nowMs = Date.now() }) => {
  const code = normalizePairingCode(entry?.code || entry?.pairingCode);
  if (!code) return null;
  const createdAt = String(entry?.createdAt || "").trim();
  const createdAtMs = parseTimestampMs(createdAt);
  if (!createdAtMs || nowMs - createdAtMs > kPairingRequestTtlMs) {
    return null;
  }
  return {
    id: code,
    code,
    channel: String(channel || "").trim(),
    accountId: normalizePairingAccountId(entry?.meta?.accountId || entry?.accountId),
    requesterId: String(entry?.id || entry?.requesterId || "").trim(),
    createdAt,
  };
};

const readPendingPairingsFromStore = ({ fsModule, openclawDir, channel, nowMs = Date.now() }) => {
  const filePath = resolvePairingStorePath({ openclawDir, channel });
  return readPairingStore({ fsModule, filePath })
    .map((entry) => mapPairingStoreEntry({ entry, channel, nowMs }))
    .filter(Boolean);
};

const mergePendingPairings = (...lists) => {
  const merged = [];
  const seen = new Map();
  for (const list of lists) {
    for (const entry of Array.isArray(list) ? list : []) {
      const code = normalizePairingCode(entry?.code || entry?.id);
      const channel = String(entry?.channel || "").trim();
      if (!code || !channel) continue;
      const accountId = normalizePairingAccountId(entry?.accountId);
      const key = `${channel}\u0000${accountId}\u0000${code}`;
      const current = seen.get(key);
      if (!current) {
        const nextEntry = {
          ...entry,
          id: code,
          code,
          channel,
          accountId,
        };
        seen.set(key, nextEntry);
        merged.push(nextEntry);
        continue;
      }
      if (!current.requesterId && entry?.requesterId) {
        current.requesterId = String(entry.requesterId).trim();
      }
      if (!current.createdAt && entry?.createdAt) {
        current.createdAt = String(entry.createdAt).trim();
      }
    }
  }
  return merged;
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

const registerPairingRoutes = ({
  app,
  clawCmd,
  isOnboarded,
  fsModule = fs,
  openclawDir = OPENCLAW_DIR,
  approveDevicePairingDirect = defaultApproveDevicePairingDirect,
}) => {
  let pairingCache = { pending: [], ts: 0, ttlMs: 0 };
  const kPairingCacheTtlMs = 10000;
  const kEmptyPairingCacheTtlMs = 1000;
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

  const approveDeviceRequestWithAdminScope = async (requestId) => {
    try {
      const approval = await approveDevicePairingDirect(
        requestId,
        { callerScopes: kDeviceApprovalCallerScopes },
        openclawDir,
      );
      return normalizeDeviceApprovalResult(approval, requestId);
    } catch (error) {
      return {
        ok: false,
        statusCode: 500,
        error: error?.message || "Could not approve device pairing",
      };
    }
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
    if (Date.now() - pairingCache.ts < Number(pairingCache.ttlMs || 0)) {
      return res.json({ pending: pairingCache.pending });
    }

    const pending = [];
    const channels = ["telegram", "discord", "slack", "whatsapp"];
    const config = readOpenclawConfig({
      fsModule,
      openclawDir,
      fallback: {},
    });

    for (const ch of channels) {
      const pendingFromStore = readPendingPairingsFromStore({
        fsModule,
        openclawDir,
        channel: ch,
      });
      const isEnabledInConfig = config.channels?.[ch]?.enabled === true;
      if (!isEnabledInConfig && pendingFromStore.length === 0) continue;

      const result = await clawCmd(`pairing list --channel ${ch} --json`, { quiet: true });
      const rawOutput = [result.stdout, result.stderr].filter(Boolean).join("\n");
      if (rawOutput) {
        try {
          pending.push(
            ...mergePendingPairings(
              parsePendingPairings(rawOutput, ch),
              pendingFromStore,
            ),
          );
        } catch {
          pending.push(...pendingFromStore);
        }
        continue;
      }
      pending.push(...pendingFromStore);
    }

    pairingCache = {
      pending,
      ts: Date.now(),
      ttlMs: pending.length > 0 ? kPairingCacheTtlMs : kEmptyPairingCacheTtlMs,
    };
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
    pairingCache.ts = 0;
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
    const result = await clawCmd("devices list --json", {
      quiet: true,
      timeoutMs: kDevicesListCliTimeoutMs,
    });
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
          const approveResult = await approveDeviceRequestWithAdminScope(firstCliPendingId);
          if (approveResult.ok) {
            writeCliAutoApproveMarker();
            autoApprovedRequestId = String(firstCliPendingId);
          } else {
            console.log(
              `[alphaclaw] CLI auto-approve failed: ${(approveResult.error || "").slice(0, 200)}`,
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
    const requestId = String(req.params.id || "").trim();
    if (!isValidDeviceRequestId(requestId)) {
      return res.status(400).json({ ok: false, error: "Invalid device request id" });
    }
    const result = await approveDeviceRequestWithAdminScope(requestId);
    devicePairingCache.ts = 0;
    res
      .status(result.ok ? 200 : result.statusCode || 500)
      .json(toHttpDeviceApprovalPayload(result));
  });

  app.post("/api/devices/:id/reject", async (req, res) => {
    const requestId = String(req.params.id || "").trim();
    if (!isValidDeviceRequestId(requestId)) {
      return res.status(400).json({ ok: false, error: "Invalid device request id" });
    }
    const result = await clawCmd(`devices reject ${quoteCliArg(requestId)}`);
    devicePairingCache.ts = 0;
    res.json(result);
  });
};

module.exports = {
  registerPairingRoutes,
  removeAccountRequestsFromPairingStore,
};
