import { useCallback, useEffect, useState } from "https://esm.sh/preact/hooks";
import { fetchNodeExecConfig, saveNodeExecConfig } from "../../../lib/api.js";
import { showToast } from "../../toast.js";

const kDefaultExecConfig = {
  host: "gateway",
  security: "allowlist",
  ask: "on-miss",
  node: "",
};

export const useExecConfig = ({ onRestartRequired = () => {} } = {}) => {
  const [config, setConfig] = useState(kDefaultExecConfig);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const refresh = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const result = await fetchNodeExecConfig();
      const nextConfig = {
        ...kDefaultExecConfig,
        ...(result?.config || {}),
      };
      setConfig(nextConfig);
    } catch (err) {
      setError(err.message || "Could not load exec settings");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const updateField = useCallback((field, value) => {
    setConfig((prev) => {
      const next = { ...prev, [field]: value };
      if (field === "host" && value !== "node") {
        next.node = "";
      }
      return next;
    });
  }, []);

  const save = useCallback(async () => {
    if (saving) return false;
    setSaving(true);
    setError("");
    try {
      const result = await saveNodeExecConfig(config);
      if (result?.restartRequired) {
        onRestartRequired(true);
      }
      showToast("Node exec config saved", "success");
      return true;
    } catch (err) {
      const message = err.message || "Could not save exec settings";
      setError(message);
      showToast(message, "error");
      return false;
    } finally {
      setSaving(false);
    }
  }, [config, onRestartRequired, saving]);

  return {
    config,
    loading,
    saving,
    error,
    refresh,
    updateField,
    save,
  };
};
