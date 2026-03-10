import { useCallback, useEffect, useMemo, useState } from "https://esm.sh/preact/hooks";
import { useAgentSessions } from "./useAgentSessions.js";

export const kNoDestinationSessionValue = "__none__";

export const kDestinationSessionFilter = (sessionRow) => {
  const key = String(sessionRow?.key || "").toLowerCase();
  return key.includes(":direct:") || key.includes(":group:");
};

export const getDestinationFromSession = (sessionRow = null) => {
  const channel = String(sessionRow?.replyChannel || "").trim();
  const to = String(sessionRow?.replyTo || "").trim();
  if (!channel || !to) return null;
  const key = String(sessionRow?.key || "").trim();
  const agentMatch = key.match(/^agent:([^:]+):/);
  const agentId = String(agentMatch?.[1] || "").trim();
  return {
    channel,
    to,
    ...(agentId ? { agentId } : {}),
  };
};

export const useDestinationSessionSelection = ({
  enabled = false,
  resetKey = "",
} = {}) => {
  const [manualSessionKey, setManualSessionKey] = useState("");
  const [hasManualSelection, setHasManualSelection] = useState(false);
  const {
    sessions,
    selectedSessionKey,
    setSelectedSessionKey,
    loading,
    error,
  } = useAgentSessions({
    enabled,
    filter: kDestinationSessionFilter,
  });

  useEffect(() => {
    if (!enabled) return;
    setManualSessionKey("");
    setHasManualSelection(false);
  }, [enabled, resetKey]);

  const preferredSessionKey = useMemo(() => {
    const matchingPreferredSession = sessions.find(
      (sessionRow) =>
        String(sessionRow?.key || "") === String(selectedSessionKey || "").trim(),
    );
    return String(
      matchingPreferredSession?.key || sessions[0]?.key || "",
    ).trim();
  }, [sessions, selectedSessionKey]);

  const effectiveSessionKey = hasManualSelection
    ? manualSessionKey
    : preferredSessionKey;

  const selectedSession = useMemo(
    () =>
      sessions.find(
        (sessionRow) =>
          String(sessionRow?.key || "") === String(effectiveSessionKey || "").trim(),
      ) || null,
    [effectiveSessionKey, sessions],
  );

  const selectedDestination = useMemo(
    () => getDestinationFromSession(selectedSession),
    [selectedSession],
  );

  const setDestinationSessionKey = useCallback((key) => {
    const normalizedKey = String(key || "");
    setManualSessionKey(normalizedKey);
    setHasManualSelection(true);
    setSelectedSessionKey(normalizedKey);
  }, [setSelectedSessionKey]);

  return {
    sessions,
    loading,
    error,
    destinationSessionKey: effectiveSessionKey,
    setDestinationSessionKey,
    selectedDestinationSession: selectedSession,
    selectedDestination,
  };
};
