const crypto = require("crypto");
const { spawn, spawnSync } = require("child_process");

const kSessionIdleTtlMs = 15 * 60 * 1000;
const kCleanupIntervalMs = 30 * 1000;
const kMaxBufferedOutputChars = 200000;

const hasScriptCommand = () => {
  try {
    const result = spawnSync("sh", ["-lc", "command -v script >/dev/null 2>&1"], {
      stdio: "ignore",
    });
    return result.status === 0;
  } catch {
    return false;
  }
};

const createShellProcess = ({
  shell = "/bin/bash",
  cwd = process.cwd(),
  env = {},
  preferPty = false,
} = {}) => {
  if (preferPty && process.platform === "darwin") {
    return spawn("script", ["-q", "/dev/null", shell, "-i"], {
      cwd,
      env: { ...env, TERM: env.TERM || "xterm-256color" },
      stdio: "pipe",
    });
  }
  if (preferPty) {
    return spawn("script", ["-q", "-f", "-c", `${shell} -i`, "/dev/null"], {
      cwd,
      env: { ...env, TERM: env.TERM || "xterm-256color" },
      stdio: "pipe",
    });
  }
  return spawn(shell, ["-i"], {
    cwd,
    env: { ...env, TERM: env.TERM || "xterm-256color" },
    stdio: "pipe",
  });
};

const createWatchdogTerminalService = ({
  cwd = process.cwd(),
  shell = process.env.SHELL || "/bin/bash",
  env = process.env,
} = {}) => {
  let session = null;
  const preferPty = hasScriptCommand();

  const notifySubscribers = (event) => {
    if (!session?.subscribers?.size) return;
    session.subscribers.forEach((subscriber) => {
      try {
        subscriber(event);
      } catch {}
    });
  };

  const appendOutput = (chunk = "") => {
    if (!session || !chunk) return;
    const chunkText = String(chunk);
    session.output += chunkText;
    session.endCursor += chunkText.length;
    if (session.output.length > kMaxBufferedOutputChars) {
      const trimCount = session.output.length - kMaxBufferedOutputChars;
      session.output = session.output.slice(trimCount);
      session.startCursor += trimCount;
    }
    notifySubscribers({ type: "output", data: chunkText });
  };

  const markActive = () => {
    if (!session) return;
    session.lastActiveAtMs = Date.now();
  };

  const createOrReuseSession = () => {
    if (session && !session.ended) {
      markActive();
      return {
        id: session.id,
        shell,
        cwd,
        ended: false,
      };
    }
    if (session && session.ended) session = null;

    const proc = createShellProcess({ shell, cwd, env, preferPty });
    const sessionId = crypto.randomUUID();
    session = {
      id: sessionId,
      proc,
      output: "",
      startCursor: 0,
      endCursor: 0,
      ended: false,
      exitCode: null,
      signal: null,
      lastActiveAtMs: Date.now(),
      subscribers: new Set(),
    };

    proc.stdout.setEncoding("utf8");
    proc.stderr.setEncoding("utf8");
    proc.stdout.on("data", (chunk) => appendOutput(chunk));
    proc.stderr.on("data", (chunk) => appendOutput(chunk));
    proc.on("close", (code, signal) => {
      if (!session || session.id !== sessionId) return;
      session.ended = true;
      session.exitCode = code;
      session.signal = signal;
      const endLine = `\r\n[terminal exited${code != null ? ` with code ${code}` : ""}${signal ? ` (${signal})` : ""}]\r\n`;
      appendOutput(endLine);
      notifySubscribers({
        type: "exit",
        code,
        signal,
      });
    });

    return {
      id: session.id,
      shell,
      cwd,
      ended: false,
    };
  };

  const subscribe = ({
    sessionId = "",
    onEvent = () => {},
    replayBuffer = true,
    tailLines = 0,
  } = {}) => {
    if (!session || String(session.id) !== String(sessionId || "")) {
      return {
        ok: false,
        error: "Terminal session not found",
        unsubscribe: () => {},
      };
    }
    markActive();
    const subscriber = (event) => onEvent(event);
    session.subscribers.add(subscriber);
    if (replayBuffer && session.output) {
      onEvent({ type: "output", data: session.output });
    } else if (!replayBuffer && Number(tailLines || 0) > 0 && !session.ended) {
      const lines = String(session.output || "").split("\n");
      const count = Math.max(1, Math.floor(Number(tailLines || 0)));
      const tail = lines.slice(-count).join("\n");
      if (tail.trim()) onEvent({ type: "output", data: tail });
    }
    if (session.ended) {
      onEvent({
        type: "exit",
        code: session.exitCode,
        signal: session.signal,
      });
    }
    return {
      ok: true,
      unsubscribe: () => {
        if (!session) return;
        session.subscribers.delete(subscriber);
      },
    };
  };

  const readOutput = ({ sessionId = "", cursor = 0 } = {}) => {
    if (!session || String(session.id) !== String(sessionId || "")) {
      return {
        found: false,
        output: "",
        cursor: 0,
        startCursor: 0,
        endCursor: 0,
        ended: true,
      };
    }
    markActive();
    const requestedCursor = Number(cursor);
    const safeCursor = Number.isFinite(requestedCursor)
      ? Math.max(0, Math.floor(requestedCursor))
      : 0;
    const effectiveCursor =
      safeCursor < session.startCursor || safeCursor > session.endCursor
        ? session.startCursor
        : safeCursor;
    const sliceIndex = Math.max(0, effectiveCursor - session.startCursor);
    return {
      found: true,
      output: session.output.slice(sliceIndex),
      cursor: session.endCursor,
      startCursor: session.startCursor,
      endCursor: session.endCursor,
      ended: !!session.ended,
      exitCode: session.exitCode,
      signal: session.signal,
    };
  };

  const writeInput = ({ sessionId = "", input = "" } = {}) => {
    if (!session || String(session.id) !== String(sessionId || "")) {
      return { ok: false, error: "Terminal session not found" };
    }
    if (session.ended || !session.proc.stdin.writable) {
      return { ok: false, error: "Terminal session has ended" };
    }
    markActive();
    session.proc.stdin.write(String(input || ""));
    return { ok: true };
  };

  const closeSession = ({ sessionId = "" } = {}) => {
    if (!session || String(session.id) !== String(sessionId || "")) {
      return { ok: true };
    }
    const targetProc = session.proc;
    session = null;
    try {
      targetProc.kill("SIGTERM");
    } catch {}
    return { ok: true };
  };

  const disposeSession = () => {
    if (!session) return;
    const targetProc = session.proc;
    session = null;
    try {
      targetProc.kill("SIGTERM");
    } catch {}
  };

  const cleanupTimer = setInterval(() => {
    if (!session || session.ended) return;
    const idleForMs = Date.now() - Number(session.lastActiveAtMs || 0);
    if (idleForMs < kSessionIdleTtlMs) return;
    try {
      session.proc.kill("SIGTERM");
    } catch {}
  }, kCleanupIntervalMs);
  cleanupTimer.unref?.();

  return {
    createOrReuseSession,
    subscribe,
    readOutput,
    writeInput,
    closeSession,
    disposeSession,
  };
};

module.exports = {
  createWatchdogTerminalService,
};
