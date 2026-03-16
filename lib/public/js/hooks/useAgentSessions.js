import { useState, useEffect, useMemo, useCallback } from "https://esm.sh/preact/hooks";
import { fetchAgentSessions } from "../lib/api.js";
import {
  kAgentSessionsCacheKey,
  kAgentLastSessionKey,
} from "../lib/storage-keys.js";
import {
  getSessionRowKey,
  isDestinationSessionKey,
  sortSessionsByPriority,
} from "../lib/session-keys.js";

const readCachedSessions = () => {
  try {
    const raw = localStorage.getItem(kAgentSessionsCacheKey);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const writeCachedSessions = (sessions) => {
  try {
    localStorage.setItem(kAgentSessionsCacheKey, JSON.stringify(sessions));
  } catch {}
};

const readLastSessionKey = () => {
  try {
    return localStorage.getItem(kAgentLastSessionKey) || "";
  } catch {
    return "";
  }
};

const writeLastSessionKey = (key) => {
  try {
    localStorage.setItem(kAgentLastSessionKey, String(key || ""));
  } catch {}
};

const pickPreferredSession = (sessions, lastKey) => {
  if (lastKey) {
    const lastMatch = sessions.find((row) => getSessionRowKey(row) === lastKey);
    if (lastMatch) return lastMatch;
  }
  return (
    sessions.find((row) => getSessionRowKey(row).toLowerCase() === "agent:main:main") ||
    sessions.find((row) => {
      return isDestinationSessionKey(getSessionRowKey(row));
    }) ||
    sessions[0] ||
    null
  );
};

/**
 * Shared hook for agent session selection with localStorage caching.
 *
 * @param {object} options
 * @param {boolean} options.enabled - Whether to load sessions (tie to modal visibility, etc.)
 * @param {(sessions: Array) => Array} [options.filter] - Optional filter applied to the session list before exposing it.
 * @returns {{ sessions, selectedSessionKey, setSelectedSessionKey, selectedSession, loading, error }}
 */
export const useAgentSessions = ({ enabled = false, filter } = {}) => {
  const [allSessions, setAllSessions] = useState([]);
  const [selectedSessionKey, setSelectedSessionKeyState] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const setSelectedSessionKey = useCallback((key) => {
    const normalized = String(key || "");
    setSelectedSessionKeyState(normalized);
    writeLastSessionKey(normalized);
  }, []);

  useEffect(() => {
    if (!enabled) return;
    let active = true;

    const cached = readCachedSessions();
    const lastKey = readLastSessionKey();
    if (cached.length > 0) {
      setAllSessions(cached);
      const preferred = pickPreferredSession(cached, lastKey);
      setSelectedSessionKeyState(getSessionRowKey(preferred));
    }

    const load = async () => {
      try {
        if (cached.length === 0) setLoading(true);
        setError("");
        const data = await fetchAgentSessions();
        if (!active) return;
        const nextSessions = Array.isArray(data?.sessions) ? data.sessions : [];
        setAllSessions(nextSessions);
        writeCachedSessions(nextSessions);
        if (cached.length === 0 || !lastKey) {
          const preferred = pickPreferredSession(nextSessions, lastKey);
          setSelectedSessionKeyState(getSessionRowKey(preferred));
        }
      } catch (err) {
        if (!active) return;
        if (cached.length === 0) {
          setAllSessions([]);
          setSelectedSessionKeyState("");
          setError(err.message || "Could not load agent sessions");
        }
      } finally {
        if (active) setLoading(false);
      }
    };
    load();
    return () => {
      active = false;
    };
  }, [enabled]);

  const sessions = useMemo(
    () => sortSessionsByPriority(filter ? allSessions.filter(filter) : allSessions),
    [allSessions, filter],
  );

  useEffect(() => {
    if (!enabled) return;
    if (sessions.length === 0) {
      if (selectedSessionKey) setSelectedSessionKeyState("");
      return;
    }
    const hasSelectedSession = sessions.some(
      (row) => getSessionRowKey(row) === String(selectedSessionKey || ""),
    );
    if (hasSelectedSession) return;
    const preferred = pickPreferredSession(sessions, readLastSessionKey());
    setSelectedSessionKeyState(getSessionRowKey(preferred));
  }, [enabled, sessions, selectedSessionKey]);

  const selectedSession = useMemo(
    () => sessions.find((row) => getSessionRowKey(row) === selectedSessionKey) || null,
    [sessions, selectedSessionKey],
  );

  return { sessions, selectedSessionKey, setSelectedSessionKey, selectedSession, loading, error };
};
