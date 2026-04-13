import { useEffect, useRef, useState } from "preact/hooks";
import {
  disconnectCodex,
  exchangeCodexOAuth,
  fetchCodexStatus,
} from "../../lib/api.js";
import {
  isCodexAuthCallbackMessage,
  openCodexAuthWindow,
} from "../../lib/codex-oauth-window.js";

export const useWelcomeCodex = ({ setFormError } = {}) => {
  const [codexStatus, setCodexStatus] = useState({ connected: false });
  const [codexLoading, setCodexLoading] = useState(true);
  const [codexManualInput, setCodexManualInput] = useState("");
  const [codexExchanging, setCodexExchanging] = useState(false);
  const [codexAuthStarted, setCodexAuthStarted] = useState(false);
  const [codexAuthWaiting, setCodexAuthWaiting] = useState(false);
  const codexExchangeInFlightRef = useRef(false);
  const codexPopupPollRef = useRef(null);

  const refreshCodexStatus = async () => {
    try {
      const status = await fetchCodexStatus();
      setCodexStatus(status);
      if (status?.connected) {
        setCodexAuthStarted(false);
        setCodexAuthWaiting(false);
      }
    } catch {
      setCodexStatus({ connected: false });
    } finally {
      setCodexLoading(false);
    }
  };

  useEffect(() => {
    refreshCodexStatus();
  }, []);

  const submitCodexAuthInput = async (input) => {
    const normalizedInput = String(input || "").trim();
    if (!normalizedInput || codexExchangeInFlightRef.current) return;
    codexExchangeInFlightRef.current = true;
    setCodexManualInput(normalizedInput);
    setCodexExchanging(true);
    setFormError(null);
    try {
      const result = await exchangeCodexOAuth(normalizedInput);
      if (!result.ok)
        throw new Error(result.error || "Codex OAuth exchange failed");
      setCodexManualInput("");
      setCodexAuthStarted(false);
      setCodexAuthWaiting(false);
      await refreshCodexStatus();
    } catch (err) {
      setCodexAuthWaiting(false);
      setFormError(err.message || "Codex OAuth exchange failed");
    } finally {
      codexExchangeInFlightRef.current = false;
      setCodexExchanging(false);
    }
  };

  useEffect(() => {
    const onMessage = async (e) => {
      if (e.data?.codex === "success") {
        await refreshCodexStatus();
      } else if (isCodexAuthCallbackMessage(e.data)) {
        await submitCodexAuthInput(e.data.input);
      }
      if (e.data?.codex === "error") {
        setFormError(`Codex auth failed: ${e.data.message || "unknown error"}`);
      }
    };
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [setFormError, submitCodexAuthInput]);

  useEffect(
    () => () => {
      if (codexPopupPollRef.current) {
        clearInterval(codexPopupPollRef.current);
        codexPopupPollRef.current = null;
      }
    },
    [],
  );

  const startCodexAuth = () => {
    if (codexStatus.connected) return;
    setCodexAuthStarted(true);
    setCodexAuthWaiting(true);
    const popup = openCodexAuthWindow();
    if (!popup || popup.closed) {
      setCodexAuthWaiting(false);
      return;
    }
    if (codexPopupPollRef.current) {
      clearInterval(codexPopupPollRef.current);
    }
    codexPopupPollRef.current = setInterval(() => {
      if (popup.closed) {
        clearInterval(codexPopupPollRef.current);
        codexPopupPollRef.current = null;
        setCodexAuthWaiting(false);
      }
    }, 500);
  };

  const completeCodexAuth = async () => {
    await submitCodexAuthInput(codexManualInput);
  };

  const handleCodexDisconnect = async () => {
    const result = await disconnectCodex();
    if (!result.ok) {
      setFormError(result.error || "Failed to disconnect Codex");
      return;
    }
    setCodexAuthStarted(false);
    setCodexAuthWaiting(false);
    setCodexManualInput("");
    await refreshCodexStatus();
  };

  return {
    codexStatus,
    codexLoading,
    codexManualInput,
    setCodexManualInput,
    codexExchanging,
    codexAuthStarted,
    codexAuthWaiting,
    startCodexAuth,
    completeCodexAuth,
    handleCodexDisconnect,
  };
};
