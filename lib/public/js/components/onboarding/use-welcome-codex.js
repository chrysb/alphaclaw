import { useEffect, useRef, useState } from "https://esm.sh/preact/hooks";
import {
  disconnectCodex,
  exchangeCodexOAuth,
  fetchCodexStatus,
} from "../../lib/api.js";

export const useWelcomeCodex = ({ setFormError } = {}) => {
  const [codexStatus, setCodexStatus] = useState({ connected: false });
  const [codexLoading, setCodexLoading] = useState(true);
  const [codexManualInput, setCodexManualInput] = useState("");
  const [codexExchanging, setCodexExchanging] = useState(false);
  const [codexAuthStarted, setCodexAuthStarted] = useState(false);
  const [codexAuthWaiting, setCodexAuthWaiting] = useState(false);
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

  useEffect(() => {
    const onMessage = async (e) => {
      if (e.data?.codex === "success") {
        await refreshCodexStatus();
      }
      if (e.data?.codex === "error") {
        setFormError(`Codex auth failed: ${e.data.message || "unknown error"}`);
      }
    };
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [setFormError]);

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
    const authUrl = "/auth/codex/start";
    const popup = window.open(
      authUrl,
      "codex-auth",
      "popup=yes,width=640,height=780",
    );
    if (!popup || popup.closed) {
      setCodexAuthWaiting(false);
      window.location.href = authUrl;
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
    if (!codexManualInput.trim() || codexExchanging) return;
    setCodexExchanging(true);
    setFormError(null);
    try {
      const result = await exchangeCodexOAuth(codexManualInput.trim());
      if (!result.ok)
        throw new Error(result.error || "Codex OAuth exchange failed");
      setCodexManualInput("");
      setCodexAuthStarted(false);
      setCodexAuthWaiting(false);
      await refreshCodexStatus();
    } catch (err) {
      setFormError(err.message || "Codex OAuth exchange failed");
    } finally {
      setCodexExchanging(false);
    }
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
