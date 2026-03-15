const { WebSocketServer } = require("ws");

const kWatchdogTerminalWsPath = "/api/watchdog/terminal/ws";

const createWatchdogTerminalWsBridge = ({
  server,
  proxy,
  getGatewayUrl,
  isAuthorizedRequest,
  watchdogTerminal,
}) => {
  const watchdogTerminalWss = new WebSocketServer({ noServer: true });

  watchdogTerminalWss.on("connection", (socket) => {
    let closed = false;
    const terminalSession = watchdogTerminal.createOrReuseSession();
    const sessionId = String(terminalSession?.id || "");
    if (!sessionId) {
      socket.close(1011, "No terminal session");
      return;
    }

    const send = (payload = {}) => {
      if (closed || socket.readyState !== 1) return;
      socket.send(JSON.stringify(payload));
    };

    send({
      type: "session",
      session: terminalSession,
    });

    const subscription = watchdogTerminal.subscribe({
      sessionId,
      replayBuffer: false,
      tailLines: 1,
      onEvent: (event) => {
        if (event?.type === "output") {
          send({ type: "output", data: String(event.data || "") });
          return;
        }
        if (event?.type === "exit") {
          send({
            type: "exit",
            code: event.code ?? null,
            signal: event.signal ?? null,
          });
        }
      },
    });
    if (!subscription.ok) {
      socket.close(1011, "Terminal subscribe failed");
      return;
    }

    socket.on("message", (rawData) => {
      let payload = null;
      try {
        payload = JSON.parse(String(rawData || ""));
      } catch {
        return;
      }
      const messageType = String(payload?.type || "");
      if (messageType !== "input") return;
      const data = String(payload?.data || "");
      if (!data) return;
      watchdogTerminal.writeInput({ sessionId, input: data });
    });

    socket.on("close", () => {
      closed = true;
      subscription.unsubscribe();
    });
    socket.on("error", () => {
      closed = true;
      subscription.unsubscribe();
    });
  });

  server.on("upgrade", (req, socket, head) => {
    const requestUrl = new URL(
      req.url || "/",
      `http://${req.headers.host || "localhost"}`,
    );
    if (
      requestUrl.pathname.startsWith("/openclaw") ||
      requestUrl.pathname === kWatchdogTerminalWsPath
    ) {
      const upgradeReq = {
        headers: req.headers,
        path: requestUrl.pathname,
        query: Object.fromEntries(requestUrl.searchParams.entries()),
      };
      if (!isAuthorizedRequest(upgradeReq)) {
        socket.write(
          "HTTP/1.1 401 Unauthorized\r\nContent-Type: text/plain\r\nConnection: close\r\n\r\nUnauthorized",
        );
        socket.destroy();
        return;
      }
    }
    if (requestUrl.pathname === kWatchdogTerminalWsPath) {
      watchdogTerminalWss.handleUpgrade(req, socket, head, (ws) => {
        watchdogTerminalWss.emit("connection", ws, req);
      });
      return;
    }
    proxy.ws(req, socket, head, { target: getGatewayUrl() });
  });
};

module.exports = {
  createWatchdogTerminalWsBridge,
};
