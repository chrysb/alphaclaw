import { useCallback, useEffect, useState } from "https://esm.sh/preact/hooks";
import {
  createAgent,
  deleteAgent,
  fetchAgents,
  setDefaultAgent,
  updateAgent,
} from "../../lib/api.js";

export const useAgents = () => {
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const loadAgents = useCallback(async () => {
    setLoading(true);
    try {
      const payload = await fetchAgents();
      setAgents(Array.isArray(payload?.agents) ? payload.agents : []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAgents();
  }, [loadAgents]);

  const create = useCallback(async (input) => {
    setSaving(true);
    try {
      const payload = await createAgent(input);
      setAgents((previous) => [...previous, payload.agent]);
      return payload.agent;
    } finally {
      setSaving(false);
    }
  }, []);

  const update = useCallback(async (agentId, patch) => {
    setSaving(true);
    try {
      const payload = await updateAgent(agentId, patch);
      setAgents((previous) =>
        previous.map((entry) => (entry.id === agentId ? payload.agent : entry)),
      );
      return payload.agent;
    } finally {
      setSaving(false);
    }
  }, []);

  const setDefault = useCallback(async (agentId) => {
    setSaving(true);
    try {
      await setDefaultAgent(agentId);
      setAgents((previous) =>
        previous.map((entry) => ({ ...entry, default: entry.id === agentId })),
      );
    } finally {
      setSaving(false);
    }
  }, []);

  const remove = useCallback(async (agentId, options = {}) => {
    setSaving(true);
    try {
      await deleteAgent(agentId, options);
      setAgents((previous) => previous.filter((entry) => entry.id !== agentId));
    } finally {
      setSaving(false);
    }
  }, []);

  return {
    state: {
      agents,
      loading,
      saving,
    },
    actions: {
      create,
      loadAgents,
      remove,
      setDefault,
      update,
    },
  };
};
