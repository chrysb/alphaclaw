const { spawn } = require("child_process");

const kDefaultStopTimeoutMs = 5000;
const kDefaultBindHost = "127.0.0.1";
const kDefaultServerHost = "127.0.0.1";
const kPersonalClientName = "personal";

const resolveClientName = (account = {}) => {
  const rawClient = String(account?.client || "").trim();
  if (rawClient) return rawClient;
  if (account?.personal) return kPersonalClientName;
  return "default";
};

const isPidRunning = (pid) => {
  const normalizedPid = Number.parseInt(String(pid || ""), 10);
  if (!Number.isFinite(normalizedPid) || normalizedPid <= 0) return false;
  try {
    process.kill(normalizedPid, 0);
    return true;
  } catch {
    return false;
  }
};

const createStatus = (entry = {}) => ({
  running: Boolean(entry.child && !entry.child.killed),
  pid: entry.child?.pid || null,
  port: entry.port || null,
  accountId: entry.accountId || "",
  email: entry.email || "",
  client: entry.client || "default",
  startedAt: entry.startedAt || null,
});

const createGmailServeManager = ({
  constants,
  onServeExit = () => {},
}) => {
  const entriesByAccountId = new Map();

  const getEntry = (accountId = "") =>
    entriesByAccountId.get(String(accountId || "").trim()) || null;

  const removeEntry = (accountId = "") => {
    entriesByAccountId.delete(String(accountId || "").trim());
  };

  const getServeStatus = (accountId = "") => {
    const entry = getEntry(accountId);
    if (!entry) return createStatus({ accountId });
    return createStatus(entry);
  };

  const listServeStatuses = () =>
    Array.from(entriesByAccountId.values()).map((entry) => createStatus(entry));

  const buildArgs = ({
    account,
    port,
    webhookToken,
  }) => {
    const client = resolveClientName(account);
    const args = [];
    if (client !== "default") {
      args.push("--client", client);
    }
    args.push(
      "gmail",
      "watch",
      "serve",
      "--account",
      String(account?.email || ""),
      "--bind",
      kDefaultBindHost,
      "--port",
      String(port),
      "--path",
      "/",
      "--hook-url",
      `http://${kDefaultServerHost}:${constants.PORT}/hooks/gmail`,
      "--hook-token",
      String(webhookToken || ""),
      "--include-body",
      "--max-bytes",
      String(constants.kGmailMaxBodyBytes || 20000),
    );
    return args;
  };

  const startServe = async ({
    account,
    port,
    webhookToken,
  }) => {
    const accountId = String(account?.id || "").trim();
    if (!accountId) throw new Error("Account id is required");
    const email = String(account?.email || "").trim();
    if (!email) throw new Error("Account email is required");
    if (!isPidRunning(getEntry(accountId)?.child?.pid)) {
      removeEntry(accountId);
    }
    const existingEntry = getEntry(accountId);
    if (existingEntry?.child?.pid && isPidRunning(existingEntry.child.pid)) {
      return createStatus(existingEntry);
    }
    const normalizedPort = Number.parseInt(String(port || ""), 10);
    if (!Number.isFinite(normalizedPort) || normalizedPort <= 0) {
      throw new Error("A valid serve port is required");
    }
    const token = String(webhookToken || "").trim();
    if (!token) {
      throw new Error("WEBHOOK_TOKEN is required to start Gmail watch serve");
    }

    const args = buildArgs({ account, port: normalizedPort, webhookToken: token });
    const env = {
      ...process.env,
      XDG_CONFIG_HOME: constants.OPENCLAW_DIR,
      GOG_KEYRING_PASSWORD: constants.GOG_KEYRING_PASSWORD,
    };
    const child = spawn("gog", args, {
      env,
      stdio: ["ignore", "pipe", "pipe"],
    });

    child.stdout.on("data", () => {});
    child.stderr.on("data", () => {});

    const nextEntry = {
      accountId,
      email,
      client: resolveClientName(account),
      port: normalizedPort,
      startedAt: new Date().toISOString(),
      child,
    };
    entriesByAccountId.set(accountId, nextEntry);

    child.on("exit", (code, signal) => {
      const currentEntry = getEntry(accountId);
      if (currentEntry?.child === child) {
        removeEntry(accountId);
      }
      onServeExit({
        accountId,
        email,
        client: nextEntry.client,
        port: normalizedPort,
        code,
        signal,
      });
    });

    return createStatus(nextEntry);
  };

  const stopServe = async ({
    accountId,
    timeoutMs = kDefaultStopTimeoutMs,
  }) => {
    const normalizedAccountId = String(accountId || "").trim();
    const entry = getEntry(normalizedAccountId);
    if (!entry?.child) {
      return { stopped: true, accountId: normalizedAccountId };
    }
    const child = entry.child;
    if (!isPidRunning(child.pid)) {
      removeEntry(normalizedAccountId);
      return { stopped: true, accountId: normalizedAccountId };
    }
    return await new Promise((resolve) => {
      let settled = false;
      const finalize = (result) => {
        if (settled) return;
        settled = true;
        removeEntry(normalizedAccountId);
        resolve(result);
      };
      const timeoutHandle = setTimeout(() => {
        try {
          child.kill("SIGKILL");
        } catch {}
        finalize({
          stopped: false,
          forced: true,
          accountId: normalizedAccountId,
        });
      }, Math.max(100, Number(timeoutMs) || kDefaultStopTimeoutMs));
      child.once("exit", () => {
        clearTimeout(timeoutHandle);
        finalize({
          stopped: true,
          forced: false,
          accountId: normalizedAccountId,
        });
      });
      try {
        child.kill("SIGTERM");
      } catch {
        clearTimeout(timeoutHandle);
        finalize({
          stopped: true,
          forced: false,
          accountId: normalizedAccountId,
        });
      }
    });
  };

  const restartServe = async ({
    account,
    port,
    webhookToken,
  }) => {
    await stopServe({ accountId: account?.id || "" });
    return await startServe({ account, port, webhookToken });
  };

  const stopAll = async () => {
    const accountIds = Array.from(entriesByAccountId.keys());
    const results = [];
    for (const accountId of accountIds) {
      // eslint-disable-next-line no-await-in-loop
      const result = await stopServe({ accountId });
      results.push(result);
    }
    return results;
  };

  return {
    getServeStatus,
    listServeStatuses,
    startServe,
    stopServe,
    restartServe,
    stopAll,
    isPidRunning,
  };
};

module.exports = {
  createGmailServeManager,
};
