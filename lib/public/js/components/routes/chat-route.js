import { h } from "https://esm.sh/preact";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "https://esm.sh/preact/hooks";
import htm from "https://esm.sh/htm";
import { marked } from "https://esm.sh/marked";
import { authFetch } from "../../lib/api.js";
import { kChatSessionDraftsStorageKey } from "../../lib/storage-keys.js";
import { showToast } from "../toast.js";

const html = htm.bind(h);
const kNewChatEventName = "alphaclaw:chat-new";
const kWsReconnectMaxAttempts = 8;
const kAutoscrollBottomThresholdPx = 40;
const kChatDebugQueryFlag = "chatDebug";

const buildMessage = ({ role = "assistant", content = "", createdAt = Date.now() } = {}) => ({
  id: crypto.randomUUID(),
  role,
  content: String(content || ""),
  createdAt: Number(createdAt) || Date.now(),
});

const formatChatTime = (createdAt) => {
  const value = Number(createdAt || 0);
  if (!value) return "";
  try {
    return new Date(value).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "";
  }
};

const escapeHtmlForMarkdown = (value = "") =>
  String(value || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");

const normalizeMarkdownInput = (value = "") => {
  const source = String(value || "").replace(/\r\n/g, "\n");
  if (source.includes("\n")) return source;
  // Some runtimes persist escaped sequences in history payloads.
  return source.includes("\\n") ? source.replace(/\\n/g, "\n") : source;
};

const normalizeListMarkers = (value = "") =>
  String(value || "").replace(/^(\s*)\d+\.\s+/gm, "$1- ");

const parseJsonMessage = (value = "") => {
  const source = String(value || "").trim();
  if (!source) return null;
  if (!(source.startsWith("{") || source.startsWith("["))) return null;
  try {
    return JSON.parse(source);
  } catch {
    return null;
  }
};

const renderMarkdownHtml = (value = "") =>
  marked.parse(escapeHtmlForMarkdown(normalizeListMarkers(normalizeMarkdownInput(value))), {
    gfm: true,
    breaks: true,
  });

export const ChatRoute = ({
  sessions = [],
  selectedSessionKey = "",
}) => {
  const [messagesBySession, setMessagesBySession] = useState({});
  const [draft, setDraft] = useState("");
  const [draftBySession, setDraftBySession] = useState(() => {
    try {
      const rawValue = localStorage.getItem(kChatSessionDraftsStorageKey);
      if (!rawValue) return {};
      const parsed = JSON.parse(rawValue);
      return parsed && typeof parsed === "object" ? parsed : {};
    } catch {
      return {};
    }
  });
  const [sending, setSending] = useState(false);
  const [streaming, setStreaming] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [rawHistoryBySession, setRawHistoryBySession] = useState({});
  const [debugEventsBySession, setDebugEventsBySession] = useState({});
  const [activeRunBySession, setActiveRunBySession] = useState({});
  const [connectionError, setConnectionError] = useState("");
  const [historyLoading, setHistoryLoading] = useState(false);
  const wsRef = useRef(null);
  const threadRef = useRef(null);
  const reconnectTimerRef = useRef(null);
  const reconnectAttemptsRef = useRef(0);
  const selectedSessionKeyRef = useRef(selectedSessionKey);
  const realtimeDisabledRef = useRef(false);
  const shouldAutoScrollRef = useRef(true);
  const appendDebugEvent = useCallback((sessionKey, label, payload) => {
    const normalizedSessionKey = String(sessionKey || selectedSessionKeyRef.current || "");
    if (!normalizedSessionKey) return;
    const nextEvent = {
      id: crypto.randomUUID(),
      at: Date.now(),
      label: String(label || ""),
      payload: payload ?? null,
    };
    setDebugEventsBySession((currentMap) => {
      const existing = currentMap[normalizedSessionKey] || [];
      const nextList = [...existing, nextEvent].slice(-30);
      return {
        ...currentMap,
        [normalizedSessionKey]: nextList,
      };
    });
  }, []);

  useEffect(() => {
    selectedSessionKeyRef.current = selectedSessionKey;
  }, [selectedSessionKey]);

  useEffect(() => {
    if (!selectedSessionKey) return;
    setDraft(String(draftBySession[selectedSessionKey] || ""));
  }, [draftBySession, selectedSessionKey]);

  useEffect(() => {
    try {
      localStorage.setItem(kChatSessionDraftsStorageKey, JSON.stringify(draftBySession));
    } catch {}
  }, [draftBySession]);

  const selectedSession = useMemo(
    () =>
      sessions.find(
        (sessionRow) => String(sessionRow?.key || "") === String(selectedSessionKey || ""),
      ) || null,
    [selectedSessionKey, sessions],
  );
  const chatDebugEnabled = useMemo(() => {
    try {
      const params = new URLSearchParams(window.location.search || "");
      return params.get(kChatDebugQueryFlag) === "1";
    } catch {
      return false;
    }
  }, []);

  const messages = useMemo(
    () => messagesBySession[selectedSessionKey] || [],
    [messagesBySession, selectedSessionKey],
  );

  useEffect(() => {
    const handleNewChat = () => {
      if (!selectedSessionKey) return;
      setMessagesBySession((currentMap) => ({
        ...currentMap,
        [selectedSessionKey]: [],
      }));
      setDraft("");
      setDraftBySession((currentMap) => ({
        ...currentMap,
        [selectedSessionKey]: "",
      }));
    };
    window.addEventListener(kNewChatEventName, handleNewChat);
    return () => {
      window.removeEventListener(kNewChatEventName, handleNewChat);
    };
  }, [selectedSessionKey]);

  useEffect(() => {
    let mounted = true;

    const connect = () => {
      if (realtimeDisabledRef.current) return;
      const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      const ws = new WebSocket(`${protocol}//${window.location.host}/api/ws/chat`);
      wsRef.current = ws;

      ws.onopen = () => {
        if (!mounted) return;
        setIsConnected(true);
        setConnectionError("");
        reconnectAttemptsRef.current = 0;
        const currentSessionKey = String(selectedSessionKeyRef.current || "");
        if (currentSessionKey) {
          setHistoryLoading(true);
          ws.send(
            JSON.stringify({
              type: "history",
              sessionKey: currentSessionKey,
            }),
          );
        }
      };

      ws.onclose = () => {
        if (!mounted) return;
        setIsConnected(false);
        setStreaming(false);
        setSending(false);
        setHistoryLoading(false);
        if (realtimeDisabledRef.current) return;
        if (reconnectAttemptsRef.current >= kWsReconnectMaxAttempts) return;
        const delayMs = Math.min(1000 * 2 ** reconnectAttemptsRef.current, 5000);
        reconnectAttemptsRef.current += 1;
        setConnectionError("Realtime chat socket disconnected.");
        reconnectTimerRef.current = setTimeout(connect, delayMs);
      };

      ws.onerror = () => {
        if (!mounted) return;
        setIsConnected(false);
        setHistoryLoading(false);
        setConnectionError("Realtime chat socket failed to connect.");
      };

      ws.onmessage = (event) => {
        let payload = null;
        try {
          payload = JSON.parse(String(event?.data || ""));
        } catch {
          return;
        }
        if (!payload || typeof payload !== "object") return;
        appendDebugEvent(
          String(payload.sessionKey || selectedSessionKeyRef.current || ""),
          `ws:${String(payload.type || "unknown")}`,
          payload,
        );

        if (payload.type === "history") {
          const historySessionKey = String(payload.sessionKey || "");
          if (!historySessionKey) return;
          const historyMessages = (Array.isArray(payload.messages) ? payload.messages : [])
            .map((messageRow) =>
              buildMessage({
                role: String(messageRow?.role || "assistant"),
                content: String(messageRow?.content || ""),
                createdAt: Number(messageRow?.timestamp) || Date.now(),
              }),
            )
            .filter((messageRow) => String(messageRow.content || "").trim());
          setMessagesBySession((currentMap) => ({
            ...currentMap,
            [historySessionKey]: historyMessages,
          }));
          setRawHistoryBySession((currentMap) => ({
            ...currentMap,
            [historySessionKey]: payload.rawHistory || null,
          }));
          setHistoryLoading(false);
          return;
        }

        if (payload.type === "chunk") {
          const chunkSessionKey = String(payload.sessionKey || selectedSessionKeyRef.current || "");
          const messageId = String(payload.messageId || "");
          const chunkText = String(payload.content || "");
          if (!chunkSessionKey || !messageId) return;
          setSending(false);
          setStreaming(true);
          setMessagesBySession((currentMap) => {
            const currentMessages = currentMap[chunkSessionKey] || [];
            const lastMessage = currentMessages[currentMessages.length - 1];
            if (
              lastMessage &&
              lastMessage.role === "assistant" &&
              String(lastMessage.id || "") === messageId
            ) {
              return {
                ...currentMap,
                [chunkSessionKey]: [
                  ...currentMessages.slice(0, -1),
                  {
                    ...lastMessage,
                    content: `${String(lastMessage.content || "")}${chunkText}`,
                  },
                ],
              };
            }
            return {
              ...currentMap,
              [chunkSessionKey]: [
                ...currentMessages,
                {
                  id: messageId,
                  role: "assistant",
                  content: chunkText,
                  createdAt: Date.now(),
                },
              ],
            };
          });
          return;
        }

        if (payload.type === "started") {
          const nextSessionKey = String(payload.sessionKey || selectedSessionKeyRef.current || "");
          const runId = String(payload.runId || "");
          if (!nextSessionKey || !runId) return;
          setActiveRunBySession((currentMap) => ({
            ...currentMap,
            [nextSessionKey]: runId,
          }));
          return;
        }

        if (payload.type === "done") {
          const doneSessionKey = String(payload.sessionKey || selectedSessionKeyRef.current || "");
          if (doneSessionKey) {
            setActiveRunBySession((currentMap) => {
              const nextMap = { ...currentMap };
              delete nextMap[doneSessionKey];
              return nextMap;
            });
          }
          setSending(false);
          setStreaming(false);
          setHistoryLoading(false);
          return;
        }

        if (payload.type === "error") {
          setSending(false);
          setStreaming(false);
          setHistoryLoading(false);
          const errorSessionKey = String(payload.sessionKey || selectedSessionKeyRef.current || "");
          if (errorSessionKey) {
            setActiveRunBySession((currentMap) => {
              const nextMap = { ...currentMap };
              delete nextMap[errorSessionKey];
              return nextMap;
            });
            setMessagesBySession((currentMap) => ({
              ...currentMap,
              [errorSessionKey]: [
                ...(currentMap[errorSessionKey] || []),
                buildMessage({
                  role: "assistant",
                  content:
                    String(payload.message || "").trim() || "Something went wrong.",
                }),
              ],
            }));
          }
          if (payload.message) showToast(String(payload.message), "error");
        }
      };
    };

    connect();

    return () => {
      mounted = false;
      if (reconnectTimerRef.current) {
        clearTimeout(reconnectTimerRef.current);
      }
      const ws = wsRef.current;
      wsRef.current = null;
      if (ws) ws.close();
    };
  }, []);

  useEffect(() => {
    if (!selectedSessionKey) return;
    const ws = wsRef.current;
    if (ws && ws.readyState === 1) {
      setHistoryLoading(true);
      appendDebugEvent(selectedSessionKey, "ws:history-request", {
        type: "history",
        sessionKey: selectedSessionKey,
      });
      ws.send(
        JSON.stringify({
          type: "history",
          sessionKey: selectedSessionKey,
        }),
      );
      return;
    }
    // Fallback for environments where websocket upgrade is unavailable:
    // load history over HTTP so the UI can still show prior messages.
    let cancelled = false;
    const loadHistory = async () => {
      try {
        setHistoryLoading(true);
        const response = await authFetch(
          `/api/chat/history?sessionKey=${encodeURIComponent(selectedSessionKey)}`,
        );
        const payload = await response.json();
        if (cancelled) return;
        if (!response.ok || payload?.ok === false) {
          throw new Error(payload?.error || "Could not load chat history");
        }
        appendDebugEvent(selectedSessionKey, "http:history-response", payload);
        const historyMessages = (Array.isArray(payload.messages) ? payload.messages : [])
          .map((messageRow) =>
            buildMessage({
              role: String(messageRow?.role || "assistant"),
              content: String(messageRow?.content || ""),
              createdAt: Number(messageRow?.timestamp) || Date.now(),
            }),
          )
          .filter((messageRow) => String(messageRow.content || "").trim());
        setMessagesBySession((currentMap) => ({
          ...currentMap,
          [selectedSessionKey]: historyMessages,
        }));
        setRawHistoryBySession((currentMap) => ({
          ...currentMap,
          [selectedSessionKey]: payload.rawHistory || null,
        }));
        if (!isConnected) {
          // If HTTP history works while WS is down, stop noisy reconnect loops.
          realtimeDisabledRef.current = true;
          if (reconnectTimerRef.current) {
            clearTimeout(reconnectTimerRef.current);
            reconnectTimerRef.current = null;
          }
          const ws = wsRef.current;
          if (ws) ws.close();
          setConnectionError("Realtime unavailable; using HTTP fallback.");
        }
      } catch (err) {
        if (cancelled) return;
        const errorMessage = err.message || "Could not load chat history.";
        appendDebugEvent(selectedSessionKey, "http:history-error", {
          error: errorMessage,
        });
        if (
          errorMessage.toLowerCase().includes("runtime unavailable") ||
          errorMessage.toLowerCase().includes("websocket unavailable")
        ) {
          realtimeDisabledRef.current = true;
          if (reconnectTimerRef.current) {
            clearTimeout(reconnectTimerRef.current);
            reconnectTimerRef.current = null;
          }
          const ws = wsRef.current;
          if (ws) ws.close();
          setConnectionError("Chat runtime unavailable (missing server dependency).");
        } else {
          setConnectionError(errorMessage);
        }
      } finally {
        if (!cancelled) setHistoryLoading(false);
      }
    };
    loadHistory();
    return () => {
      cancelled = true;
    };
  }, [isConnected, selectedSessionKey]);

  const handleThreadScroll = useCallback(() => {
    const threadElement = threadRef.current;
    if (!threadElement) return;
    const distanceFromBottom =
      threadElement.scrollHeight -
      threadElement.scrollTop -
      threadElement.clientHeight;
    shouldAutoScrollRef.current = distanceFromBottom <= kAutoscrollBottomThresholdPx;
  }, []);

  useEffect(() => {
    const threadElement = threadRef.current;
    if (!threadElement) return;
    if (!shouldAutoScrollRef.current) return;
    threadElement.scrollTop = threadElement.scrollHeight;
  }, [messages, historyLoading, streaming]);

  const handleDraftInput = useCallback(
    (event) => {
      const nextValue = String(event?.target?.value || "");
      setDraft(nextValue);
      if (!selectedSessionKey) return;
      setDraftBySession((currentMap) => ({
        ...currentMap,
        [selectedSessionKey]: nextValue,
      }));
    },
    [selectedSessionKey],
  );

  const handleSend = useCallback(() => {
    const messageText = String(draft || "").trim();
    const ws = wsRef.current;
    if (!messageText || !selectedSessionKey || sending || streaming) return;
    if (!ws || ws.readyState !== 1) {
      showToast("Chat websocket is unavailable in this environment.", "warning");
      return;
    }

    const userMessage = buildMessage({
      role: "user",
      content: messageText,
    });
    setDraft("");
    setDraftBySession((currentMap) => ({
      ...currentMap,
      [selectedSessionKey]: "",
    }));
    setSending(true);
    setMessagesBySession((currentMap) => ({
      ...currentMap,
      [selectedSessionKey]: [...(currentMap[selectedSessionKey] || []), userMessage],
    }));
    setStreaming(true);
    ws.send(
      JSON.stringify({
        type: "message",
        content: messageText,
        sessionKey: selectedSessionKey,
      }),
    );
    appendDebugEvent(selectedSessionKey, "ws:message-request", {
      type: "message",
      content: messageText,
      sessionKey: selectedSessionKey,
    });
  }, [appendDebugEvent, draft, selectedSessionKey, sending, streaming]);

  const handleStop = useCallback(() => {
    const ws = wsRef.current;
    if (!ws || ws.readyState !== 1 || !selectedSessionKey) return;
    ws.send(
      JSON.stringify({
        type: "stop",
        sessionKey: selectedSessionKey,
      }),
    );
    appendDebugEvent(selectedSessionKey, "ws:stop-request", {
      type: "stop",
      sessionKey: selectedSessionKey,
    });
    setStreaming(false);
    setSending(false);
  }, [appendDebugEvent, selectedSessionKey]);

  const rawHistory = selectedSessionKey ? rawHistoryBySession[selectedSessionKey] : null;
  const debugEvents = selectedSessionKey ? debugEventsBySession[selectedSessionKey] || [] : [];

  return html`
    <div class="chat-route-shell">
      <div class="chat-route-header">
        <div>
          <div class="chat-route-title">Chat</div>
          <div class="chat-route-subtitle">
            ${selectedSession?.label || "Pick a session in the sidebar"}
          </div>
          ${connectionError
            ? html`<div class="chat-route-warning">${connectionError}</div>`
            : null}
        </div>
      </div>
      <div class="chat-thread" ref=${threadRef} onscroll=${handleThreadScroll}>
        ${!selectedSessionKey
          ? html`<div class="chat-empty-state">Select a session to begin chatting.</div>`
          : historyLoading
            ? html`<div class="chat-empty-state">Loading history...</div>`
          : messages.length === 0
            ? html`<div class="chat-empty-state">Start a message in this session.</div>`
            : messages.map(
                (message) => html`
                  <div
                    key=${message.id}
                    class=${`chat-bubble ${message.role === "user" ? "is-user" : "is-assistant"}`}
                  >
                    <div class="chat-bubble-meta">
                      <span>${message.role === "user" ? "You" : "Agent"}</span>
                      <span>${formatChatTime(message.createdAt)}</span>
                    </div>
                    ${(() => {
                      const parsedJson = parseJsonMessage(message.content);
                      if (parsedJson) {
                        return html`<pre class="chat-bubble-content chat-bubble-json">${JSON.stringify(
                          parsedJson,
                          null,
                          2,
                        )}</pre>`;
                      }
                      return html`
                        <div
                          class="chat-bubble-content chat-bubble-markdown"
                          dangerouslySetInnerHTML=${{
                            __html: renderMarkdownHtml(message.content),
                          }}
                        ></div>
                      `;
                    })()}
                  </div>
                `,
              )}
        ${selectedSessionKey && (sending || streaming)
          ? html`
              <div class="chat-bubble is-assistant chat-typing-indicator">
                <div class="chat-bubble-meta">
                  <span>Agent</span>
                  <span>${isConnected ? "typing..." : "reconnecting..."}</span>
                </div>
                <div class="chat-typing-dots">
                  <span></span><span></span><span></span>
                </div>
              </div>
            `
          : null}
        ${selectedSessionKey
          ? chatDebugEnabled
            ? html`
              <details class="chat-raw-debug">
                <summary>Raw history JSON</summary>
                <pre>${JSON.stringify(rawHistory || null, null, 2)}</pre>
              </details>
              <details class="chat-raw-debug">
                <summary>Inbound event log</summary>
                <pre>${JSON.stringify(debugEvents, null, 2)}</pre>
              </details>
            `
            : null
          : null}
      </div>
      <div class="chat-composer">
        <textarea
          class="chat-composer-input"
          placeholder=${selectedSessionKey
            ? "Type a message..."
            : "Select a session to start"}
          value=${draft}
          disabled=${!selectedSessionKey || sending || !isConnected}
          oninput=${handleDraftInput}
        ></textarea>
        <div class="chat-composer-actions">
          ${streaming
            ? html`
                <button
                  type="button"
                  class="ac-btn-secondary chat-composer-stop"
                  disabled=${!isConnected}
                  onclick=${handleStop}
                >
                  Stop
                </button>
              `
            : null}
          <button
            type="button"
            class="ac-btn-cyan chat-composer-send"
            disabled=${!selectedSessionKey || sending || streaming || !isConnected || !String(draft || "").trim()}
            onclick=${handleSend}
          >
            ${sending || streaming ? "Sending..." : "Send"}
          </button>
        </div>
      </div>
    </div>
  `;
};
