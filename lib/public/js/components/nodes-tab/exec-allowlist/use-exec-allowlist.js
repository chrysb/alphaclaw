import { useCallback, useEffect, useState } from "https://esm.sh/preact/hooks";
import {
  addNodeExecAllowlistPattern,
  fetchNodeExecApprovals,
  removeNodeExecAllowlistPattern,
} from "../../../lib/api.js";
import { showToast } from "../../toast.js";

export const useExecAllowlist = () => {
  const [allowlist, setAllowlist] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [patternInput, setPatternInput] = useState("");
  const [saving, setSaving] = useState(false);
  const [removingId, setRemovingId] = useState("");

  const refresh = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const result = await fetchNodeExecApprovals();
      const nextAllowlist = Array.isArray(result?.allowlist) ? result.allowlist : [];
      setAllowlist(nextAllowlist);
    } catch (err) {
      setError(err.message || "Could not load allowlist");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const addPattern = useCallback(async () => {
    const nextPattern = String(patternInput || "").trim();
    if (!nextPattern || saving) return;
    setSaving(true);
    try {
      await addNodeExecAllowlistPattern(nextPattern);
      setPatternInput("");
      showToast("Allowlist pattern added", "success");
      await refresh();
    } catch (err) {
      showToast(err.message || "Could not add allowlist pattern", "error");
    } finally {
      setSaving(false);
    }
  }, [patternInput, refresh, saving]);

  const removePattern = useCallback(async (entryId) => {
    const id = String(entryId || "").trim();
    if (!id || removingId) return;
    setRemovingId(id);
    try {
      await removeNodeExecAllowlistPattern(id);
      showToast("Allowlist pattern removed", "success");
      await refresh();
    } catch (err) {
      showToast(err.message || "Could not remove allowlist pattern", "error");
    } finally {
      setRemovingId("");
    }
  }, [refresh, removingId]);

  return {
    allowlist,
    loading,
    error,
    patternInput,
    saving,
    removingId,
    setPatternInput,
    refresh,
    addPattern,
    removePattern,
  };
};
