import { useState, useCallback, useMemo, useEffect, useRef } from "https://esm.sh/preact/hooks";
import {
  resolveToolStates,
  deriveToolsConfig,
  getProfileToolIds,
} from "./tool-catalog.js";

const buildOverridesMap = (alsoAllow = [], deny = []) => {
  const map = {};
  for (const id of alsoAllow) map[id] = true;
  for (const id of deny) map[id] = false;
  return map;
};

const normalizeToolsConfig = ({
  profile = "full",
  alsoAllow = [],
  deny = [],
} = {}) => ({
  profile: String(profile || "full"),
  alsoAllow: [...(Array.isArray(alsoAllow) ? alsoAllow : [])]
    .map(String)
    .filter(Boolean)
    .sort(),
  deny: [...(Array.isArray(deny) ? deny : [])]
    .map(String)
    .filter(Boolean)
    .sort(),
});

/**
 * Manages local tool-toggle state derived from an agent's tools config.
 * Returns the current resolved states plus actions for profile/tool changes.
 */
export const useAgentTools = ({ agent = {} } = {}) => {
  const agentTools = agent.tools || {};
  const initialConfig = normalizeToolsConfig(agentTools);

  const initialProfile = initialConfig.profile;
  const initialAlsoAllow = initialConfig.alsoAllow;
  const initialDeny = initialConfig.deny;

  const [profile, setProfileRaw] = useState(initialProfile);
  const [overrides, setOverrides] = useState(() =>
    buildOverridesMap(initialAlsoAllow, initialDeny),
  );
  const [savedConfig, setSavedConfig] = useState(initialConfig);

  const agentToolsKey = JSON.stringify([agent.id, agentTools]);
  const prevKeyRef = useRef(agentToolsKey);
  useEffect(() => {
    if (prevKeyRef.current !== agentToolsKey) {
      prevKeyRef.current = agentToolsKey;
      setProfileRaw(initialProfile);
      setOverrides(buildOverridesMap(initialAlsoAllow, initialDeny));
      setSavedConfig(initialConfig);
    }
  }, [agentToolsKey, initialProfile, initialAlsoAllow, initialDeny, initialConfig]);

  const toolStates = useMemo(() => {
    const profileSet = new Set(getProfileToolIds(profile));
    const alsoAllow = [];
    const deny = [];
    for (const [id, enabled] of Object.entries(overrides)) {
      if (enabled && !profileSet.has(id)) alsoAllow.push(id);
      else if (!enabled && profileSet.has(id)) deny.push(id);
    }
    return resolveToolStates({ profile, alsoAllow, deny });
  }, [profile, overrides]);

  const toolsConfig = useMemo(
    () => deriveToolsConfig({ profile, toolStates }),
    [profile, toolStates],
  );

  const dirty = useMemo(() => {
    const next = normalizeToolsConfig(toolsConfig);
    return JSON.stringify(savedConfig) !== JSON.stringify(next);
  }, [savedConfig, toolsConfig]);

  const setProfile = useCallback((nextProfile) => {
    setProfileRaw(nextProfile);
    setOverrides({});
  }, []);

  const toggleTool = useCallback(
    (toolId, enabled) => {
      setOverrides((prev) => {
        const next = { ...prev };
        const profileSet = new Set(getProfileToolIds(profile));
        const isDefault = profileSet.has(toolId) === enabled;
        if (isDefault) {
          delete next[toolId];
        } else {
          next[toolId] = enabled;
        }
        return next;
      });
    },
    [profile],
  );

  const reset = useCallback(() => {
    setProfileRaw(savedConfig.profile);
    const map = {};
    for (const id of savedConfig.alsoAllow) map[id] = true;
    for (const id of savedConfig.deny) map[id] = false;
    setOverrides(map);
  }, [savedConfig]);

  const markSaved = useCallback((nextConfig = {}) => {
    const normalized = normalizeToolsConfig(nextConfig);
    setSavedConfig(normalized);
    setProfileRaw(normalized.profile);
    setOverrides(buildOverridesMap(normalized.alsoAllow, normalized.deny));
  }, []);

  return {
    profile,
    toolStates,
    toolsConfig,
    dirty,
    setProfile,
    toggleTool,
    reset,
    markSaved,
  };
};
