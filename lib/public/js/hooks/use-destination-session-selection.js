import { useCallback, useEffect, useMemo, useState } from "preact/hooks";
import { useAgentSessions } from "./useAgentSessions.js";
import {
  getDestinationFromSession,
  getSessionRowKey,
  kDestinationSessionFilter,
} from "../lib/session-keys.js";

export const kNoDestinationSessionValue = "__none__";

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
        getSessionRowKey(sessionRow) === String(selectedSessionKey || "").trim(),
    );
    return String(
      getSessionRowKey(matchingPreferredSession) || getSessionRowKey(sessions[0]),
    ).trim();
  }, [sessions, selectedSessionKey]);

  const effectiveSessionKey = hasManualSelection
    ? manualSessionKey
    : preferredSessionKey;

  const selectedSession = useMemo(
    () =>
      sessions.find(
        (sessionRow) =>
          getSessionRowKey(sessionRow) === String(effectiveSessionKey || "").trim(),
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
