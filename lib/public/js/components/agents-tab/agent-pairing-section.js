import { h } from "https://esm.sh/preact";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "https://esm.sh/preact/hooks";
import htm from "https://esm.sh/htm";
import { Pairings } from "../pairings.js";
import { usePolling } from "../../hooks/usePolling.js";
import {
  approvePairing,
  fetchAgentBindings,
  fetchChannelAccounts,
  fetchPairings,
  rejectPairing,
} from "../../lib/api.js";
import { showToast } from "../toast.js";

const html = htm.bind(h);

const toOwnedAccountKey = (channel, accountId) => {
  const normalizedChannel = String(channel || "").trim();
  const normalizedAccountId = String(accountId || "").trim() || "default";
  return normalizedChannel ? `${normalizedChannel}:${normalizedAccountId}` : "";
};

const announcePairingsChanged = (agentId) => {
  window.dispatchEvent(
    new CustomEvent("alphaclaw:pairings-changed", {
      detail: { agentId: String(agentId || "").trim() },
    }),
  );
};

export const AgentPairingSection = ({ agent = {} }) => {
  const [bindings, setBindings] = useState([]);
  const [channels, setChannels] = useState([]);
  const [loadingBindings, setLoadingBindings] = useState(true);
  const [pairingStatusRefreshing, setPairingStatusRefreshing] = useState(false);
  const pairingRefreshTimerRef = useRef(null);
  const pairingDelayedRefreshTimerRefs = useRef([]);
  const agentId = String(agent?.id || "").trim();
  const isDefaultAgent = !!agent?.default;

  const loadBindings = useCallback(async () => {
    setLoadingBindings(true);
    try {
      const [bindingsResult, channelsResult] = await Promise.all([
        fetchAgentBindings(agent.id),
        fetchChannelAccounts(),
      ]);
      setBindings(Array.isArray(bindingsResult?.bindings) ? bindingsResult.bindings : []);
      setChannels(Array.isArray(channelsResult?.channels) ? channelsResult.channels : []);
    } catch {
      setBindings([]);
      setChannels([]);
    } finally {
      setLoadingBindings(false);
    }
  }, [agent.id]);

  useEffect(() => {
    if (String(agent?.id || "").trim()) {
      loadBindings();
    }
  }, [agent.id, loadBindings]);

  useEffect(() => {
    const handleBindingsChanged = (event) => {
      const changedAgentId = String(event?.detail?.agentId || "").trim();
      if (changedAgentId !== agentId) return;
      loadBindings();
    };
    window.addEventListener("alphaclaw:agent-bindings-changed", handleBindingsChanged);
    return () => {
      window.removeEventListener("alphaclaw:agent-bindings-changed", handleBindingsChanged);
    };
  }, [agentId, loadBindings]);
  useEffect(
    () => () => {
      if (pairingRefreshTimerRef.current) {
        clearTimeout(pairingRefreshTimerRef.current);
      }
      for (const timerId of pairingDelayedRefreshTimerRefs.current) {
        clearTimeout(timerId);
      }
      pairingDelayedRefreshTimerRefs.current = [];
    },
    [],
  );

  const ownedAccounts = useMemo(
    () => {
      const ownedAccountMap = new Map();
      for (const binding of bindings) {
        const channelId = String(binding?.match?.channel || "").trim();
        if (!channelId) continue;
        const accountId = String(binding?.match?.accountId || "").trim() || "default";
        const key = toOwnedAccountKey(channelId, accountId);
        if (!key) continue;
        ownedAccountMap.set(key, { channel: channelId, accountId });
      }
      for (const channel of channels) {
        const channelId = String(channel?.channel || "").trim();
        const accounts = Array.isArray(channel?.accounts) ? channel.accounts : [];
        const defaultAccount = accounts.find(
          (entry) => String(entry?.id || "").trim() === "default",
        );
        if (
          isDefaultAgent
          && channelId
          && defaultAccount
          && !String(defaultAccount?.boundAgentId || "").trim()
        ) {
          const key = toOwnedAccountKey(channelId, "default");
          ownedAccountMap.set(key, { channel: channelId, accountId: "default" });
        }
      }
      return Array.from(ownedAccountMap.values());
    },
    [bindings, channels, isDefaultAgent],
  );

  const boundChannels = useMemo(
    () => Array.from(new Set(ownedAccounts.map((entry) => entry.channel))).filter(Boolean),
    [ownedAccounts],
  );

  const ownedAccountKeySet = useMemo(
    () =>
      new Set(
        ownedAccounts
          .map((entry) => toOwnedAccountKey(entry.channel, entry.accountId))
          .filter(Boolean),
      ),
    [ownedAccounts],
  );

  const accountNameMap = useMemo(() => {
    const nextMap = new Map();
    for (const channel of channels) {
      const channelId = String(channel?.channel || "").trim();
      const accounts = Array.isArray(channel?.accounts) ? channel.accounts : [];
      for (const account of accounts) {
        const accountId = String(account?.id || "").trim() || "default";
        const key = toOwnedAccountKey(channelId, accountId);
        if (!key) continue;
        const configuredName = String(account?.name || "").trim();
        nextMap.set(key, configuredName || accountId);
      }
    }
    return nextMap;
  }, [channels]);

  const ownedChannelsStatus = useMemo(() => {
    const nextStatus = {};
    for (const entry of ownedAccounts) {
      const channelId = String(entry?.channel || "").trim();
      if (!channelId) continue;
      const key = toOwnedAccountKey(channelId, entry?.accountId);
      const account = channels
        .find((channel) => String(channel?.channel || "").trim() === channelId)
        ?.accounts?.find(
          (accountEntry) =>
            (String(accountEntry?.id || "").trim() || "default")
            === (String(entry?.accountId || "").trim() || "default"),
        );
      const status = String(account?.status || "").trim() || "configured";
      if (!nextStatus[channelId] || status !== "paired") {
        nextStatus[channelId] = {
          status: status === "paired" ? "paired" : "configured",
          accountName: accountNameMap.get(key) || "",
        };
      }
    }
    return nextStatus;
  }, [accountNameMap, channels, ownedAccounts]);

  const hasUnpaired = useMemo(
    () =>
      Object.values(ownedChannelsStatus).some(
        (entry) => String(entry?.status || "").trim() !== "paired",
      ),
    [ownedChannelsStatus],
  );

  const pairingsPoll = usePolling(
    async () => {
      const data = await fetchPairings();
      const pending = Array.isArray(data?.pending) ? data.pending : [];
      return pending
        .filter((entry) =>
          ownedAccountKeySet.has(
            toOwnedAccountKey(
              String(entry?.channel || "").trim(),
              String(entry?.accountId || "").trim() || "default",
            ),
          ),
        )
        .map((entry) => {
          const key = toOwnedAccountKey(entry?.channel, entry?.accountId);
          return {
            ...entry,
            accountName: accountNameMap.get(key) || "",
          };
        });
    },
    1000,
    { enabled: hasUnpaired && ownedAccounts.length > 0 },
  );

  const pending = pairingsPoll.data || [];

  const refreshAfterPairingAction = useCallback(() => {
    setPairingStatusRefreshing(true);
    if (pairingRefreshTimerRef.current) {
      clearTimeout(pairingRefreshTimerRef.current);
    }
    pairingRefreshTimerRef.current = setTimeout(() => {
      setPairingStatusRefreshing(false);
      pairingRefreshTimerRef.current = null;
    }, 2800);
    for (const timerId of pairingDelayedRefreshTimerRefs.current) {
      clearTimeout(timerId);
    }
    pairingDelayedRefreshTimerRefs.current = [];
    const refresh = () => {
      pairingsPoll.refresh();
      loadBindings();
      announcePairingsChanged(agentId);
    };
    refresh();
    pairingDelayedRefreshTimerRefs.current.push(setTimeout(refresh, 500));
    pairingDelayedRefreshTimerRefs.current.push(setTimeout(refresh, 2000));
  }, [agentId, loadBindings, pairingsPoll]);

  const handleApprove = async (id, channel, accountId = "") => {
    try {
      await approvePairing(id, channel, accountId);
      refreshAfterPairingAction();
    } catch (err) {
      showToast(err.message || "Could not approve pairing", "error");
    }
  };

  const handleReject = async (id, channel, accountId = "") => {
    try {
      await rejectPairing(id, channel, accountId);
      refreshAfterPairingAction();
    } catch (err) {
      showToast(err.message || "Could not reject pairing", "error");
    }
  };

  if (loadingBindings) {
    return html`
      <div class="bg-surface border border-border rounded-xl p-4">
        <h3 class="card-label mb-3">Pairing</h3>
        <p class="text-sm text-gray-500">Loading pairing status...</p>
      </div>
    `;
  }

  if (!hasUnpaired) return null;

  return html`
    <${Pairings}
      pending=${pending}
      channels=${ownedChannelsStatus}
      visible=${hasUnpaired}
      statusRefreshing=${pairingStatusRefreshing}
      onApprove=${handleApprove}
      onReject=${handleReject}
    />
  `;
};
