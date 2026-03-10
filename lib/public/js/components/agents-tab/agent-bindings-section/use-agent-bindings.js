import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "https://esm.sh/preact/hooks";
import {
  createChannelAccount,
  deleteChannelAccount,
  fetchChannelAccounts,
  fetchStatus,
  updateChannelAccount,
} from "../../../lib/api.js";
import { showToast } from "../../toast.js";
import { announceBindingsChanged } from "./helpers.js";
const announceRestartRequired = () =>
  window.dispatchEvent(new CustomEvent("alphaclaw:restart-required"));

export const useAgentBindings = ({ agent = {}, agents = [] }) => {
  const [channels, setChannels] = useState([]);
  const [channelStatus, setChannelStatus] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createProvider, setCreateProvider] = useState("");
  const [menuOpenId, setMenuOpenId] = useState("");
  const [editingAccount, setEditingAccount] = useState(null);
  const [deletingAccount, setDeletingAccount] = useState(null);
  const [pendingBindAccount, setPendingBindAccount] = useState(null);

  const agentId = String(agent?.id || "").trim();
  const isDefaultAgent = !!agent?.default;
  const defaultAgentId = useMemo(
    () => String(agents.find((entry) => entry?.default)?.id || "").trim(),
    [agents],
  );
  const agentNameMap = useMemo(
    () =>
      new Map(
        agents.map((entry) => [
          String(entry?.id || "").trim(),
          String(entry?.name || "").trim() || String(entry?.id || "").trim(),
        ]),
      ),
    [agents],
  );

  const load = useCallback(async ({ includeStatus = true } = {}) => {
    setLoading(true);
    try {
      const requests = [
        fetchChannelAccounts(),
        includeStatus ? fetchStatus() : Promise.resolve(null),
      ];
      const [channelsResult, statusResult] = await Promise.all(requests);
      setChannels(
        Array.isArray(channelsResult?.channels) ? channelsResult.channels : [],
      );
      if (includeStatus && statusResult) {
        setChannelStatus(statusResult?.channels || {});
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!agentId) return;
    load().catch(() => {});
  }, [agentId, load]);

  useEffect(() => {
    const handlePairingsChanged = (event) => {
      const changedAgentId = String(event?.detail?.agentId || "").trim();
      if (changedAgentId && changedAgentId !== agentId) return;
      load({ includeStatus: true }).catch(() => {});
    };
    window.addEventListener(
      "alphaclaw:pairings-changed",
      handlePairingsChanged,
    );
    return () => {
      window.removeEventListener(
        "alphaclaw:pairings-changed",
        handlePairingsChanged,
      );
    };
  }, [agentId, load]);

  const configuredChannels = useMemo(
    () =>
      channels.filter(
        (entry) =>
          String(entry?.channel || "").trim() &&
          Array.isArray(entry?.accounts) &&
          entry.accounts.length > 0,
      ),
    [channels],
  );

  const configuredChannelMap = useMemo(
    () =>
      new Map(
        configuredChannels.map((entry) => [
          String(entry.channel || "").trim(),
          entry,
        ]),
      ),
    [configuredChannels],
  );

  const openCreateChannelModal = (channelId = "") => {
    setMenuOpenId("");
    setCreateProvider(String(channelId || "").trim());
    setShowCreateModal(true);
  };

  const openEditChannelModal = (account) => {
    setMenuOpenId("");
    setEditingAccount(account);
  };

  const openDeleteChannelDialog = (account) => {
    setMenuOpenId("");
    setDeletingAccount(account);
  };

  const handleCreateChannel = async (payload) => {
    setSaving(true);
    try {
      const result = await createChannelAccount(payload);
      setShowCreateModal(false);
      setCreateProvider("");
      announceBindingsChanged(
        String(result?.binding?.agentId || payload.agentId || "").trim(),
      );
      showToast("Channel added", "success");
      if (result?.restartRequired) {
        announceRestartRequired();
      }
      load({ includeStatus: false }).catch(() => {});
    } catch (error) {
      showToast(error.message || "Could not add channel", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateChannel = async (payload) => {
    setSaving(true);
    try {
      const result = await updateChannelAccount(payload);
      setEditingAccount(null);
      announceBindingsChanged(String(payload.agentId || "").trim());
      showToast("Channel updated", "success");
      if (result?.restartRequired) {
        announceRestartRequired();
      }
      await load();
    } catch (error) {
      showToast(error.message || "Could not update channel", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteChannel = async () => {
    if (!deletingAccount) return;
    setSaving(true);
    try {
      await deleteChannelAccount({
        provider: deletingAccount.provider,
        accountId: deletingAccount.id,
      });
      setDeletingAccount(null);
      announceBindingsChanged(agentId);
      showToast("Channel deleted", "success");
      await load({ includeStatus: false });
    } catch (error) {
      showToast(error.message || "Could not delete channel", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleQuickBind = async (account) => {
    if (!account) return;
    setSaving(true);
    try {
      await updateChannelAccount({
        provider: account.provider,
        accountId: account.id,
        name: account.name,
        agentId,
      });
      setMenuOpenId("");
      setPendingBindAccount(null);
      announceBindingsChanged(agentId);
      showToast("Channel bound", "success");
      await load();
    } catch (error) {
      showToast(error.message || "Could not bind channel", "error");
    } finally {
      setSaving(false);
    }
  };

  const requestBindAccount = (account) => {
    if (!account) return;
    const ownerAgentId = String(account?.ownerAgentId || "").trim();
    const ownerAgentName = String(account?.ownerAgentName || "").trim();
    if (ownerAgentId && ownerAgentId !== agentId && ownerAgentName) {
      setMenuOpenId("");
      setPendingBindAccount(account);
      return;
    }
    handleQuickBind(account);
  };

  return {
    agentId,
    agentNameMap,
    channelStatus,
    channels,
    configuredChannelMap,
    configuredChannels,
    createProvider,
    defaultAgentId,
    deletingAccount,
    editingAccount,
    handleCreateChannel,
    handleDeleteChannel,
    handleQuickBind,
    handleUpdateChannel,
    isDefaultAgent,
    loading,
    menuOpenId,
    openCreateChannelModal,
    openDeleteChannelDialog,
    openEditChannelModal,
    pendingBindAccount,
    requestBindAccount,
    saving,
    setCreateProvider,
    setDeletingAccount,
    setEditingAccount,
    setMenuOpenId,
    setPendingBindAccount,
    setShowCreateModal,
    showCreateModal,
  };
};
