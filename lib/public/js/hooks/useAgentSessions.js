import { useState, useEffect, useMemo, useCallback } from "https://esm.sh/preact/hooks";
import { fetchAgentSessions } from "../lib/api.js";
import {
  kAgentSessionsCacheKey,
  kAgentLastSessionKey,
} from "../lib/storage-keys.js";

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
    const lastMatch = sessions.find((row) => String(row?.key || "") === lastKey);
    if (lastMatch) return lastMatch;
  }
  return (
    sessions.find((row) => String(row?.key || "").toLowerCase() === "agent:main:main") ||
    sessions.find((row) => {
      const key = String(row?.key || "").toLowerCase();
      return key.includes(":direct:") || key.includes(":group:");
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
      setSelectedSessionKeyState(String(preferred?.key || ""));
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
          setSelectedSessionKeyState(String(preferred?.key || ""));
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
    () => (filter ? allSessions.filter(filter) : allSessions),
    [allSessions, filter],
  );

  const selectedSession = useMemo(
    () => sessions.find((row) => String(row?.key || "") === selectedSessionKey) || null,
    [sessions, selectedSessionKey],
  );

  return { sessions, selectedSessionKey, setSelectedSessionKey, selectedSession, loading, error };
};
