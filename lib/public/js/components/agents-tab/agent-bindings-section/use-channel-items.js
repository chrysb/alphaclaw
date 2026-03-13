import { h } from "https://esm.sh/preact";
import { useEffect, useMemo, useState } from "https://esm.sh/preact/hooks";
import htm from "https://esm.sh/htm";
import {
  canAgentBindAccount,
  getChannelItemSortRank,
  getResolvedAccountStatusInfo,
  isImplicitDefaultAccount,
  resolveChannelAccountLabel,
} from "./helpers.js";

const html = htm.bind(h);

export const useChannelItems = ({
  agentId = "",
  agentNameMap = new Map(),
  channelStatus = {},
  configuredChannelMap = new Map(),
  configuredChannels = [],
  defaultAgentId = "",
  isDefaultAgent = false,
}) => {
  const [showAssignedElsewhere, setShowAssignedElsewhere] = useState(false);

  const channelItemData = useMemo(() => {
    const channelOrderMap = new Map(
      configuredChannels.map((entry, index) => [
        String(entry?.channel || "").trim(),
        index,
      ]),
    );
    const accountOrderMap = new Map(
      configuredChannels.flatMap((entry) =>
        (Array.isArray(entry?.accounts) ? entry.accounts : []).map(
          (account, accountIndex) => [
            `${String(entry?.channel || "").trim()}:${String(account?.id || "").trim() || "default"}`,
            accountIndex,
          ],
        ),
      ),
    );
    const channelIds = Array.from(
      new Set([
        ...configuredChannels.map((entry) => String(entry.channel || "").trim()),
      ]),
    ).filter(Boolean);

    return channelIds
      .flatMap((channelId) => {
        const configuredChannel = configuredChannelMap.get(channelId);
        const statusInfo = channelStatus?.[channelId] || null;
        const accounts = Array.isArray(configuredChannel?.accounts)
          ? configuredChannel.accounts
          : [];

        if (!configuredChannel && !statusInfo) return [];

        return accounts.map((account) => {
          const accountId = String(account?.id || "").trim() || "default";
          const boundAgentId = String(account?.boundAgentId || "").trim();
          const accountStatusInfo = getResolvedAccountStatusInfo({
            account,
            statusInfo,
            accountId,
          });
          const isImplicitDefaultOwned =
            isDefaultAgent &&
            isImplicitDefaultAccount({ accountId, boundAgentId });
          const isOwned = boundAgentId === agentId || isImplicitDefaultOwned;
          const isImplicitDefaultElsewhere =
            !isDefaultAgent &&
            isImplicitDefaultAccount({ accountId, boundAgentId });
          const isAvailable = canAgentBindAccount({
            accountId,
            boundAgentId,
            agentId,
            isDefaultAgent,
          });
          const ownerAgentId =
            boundAgentId ||
            (isImplicitDefaultAccount({ accountId, boundAgentId })
              ? defaultAgentId
              : "");
          const ownerAgentName = String(
            agentNameMap.get(ownerAgentId) || ownerAgentId || "",
          ).trim();
          const canNavigateToOwnerAgent =
            !!ownerAgentId && ownerAgentId !== agentId && !!ownerAgentName;
          const canOpenWorkspace =
            channelId === "telegram" &&
            isOwned &&
            accountStatusInfo?.status === "paired";

          const accountData = {
            id: accountId,
            provider: channelId,
            name: resolveChannelAccountLabel({ channelId, account }),
            rawName: String(account?.name || "").trim(),
            ownerAgentId,
            ownerAgentName,
            boundAgentId,
            isOwned,
            envKey: String(account?.envKey || "").trim(),
            token: String(account?.token || "").trim(),
            isAvailable,
            isBoundElsewhere:
              !isOwned &&
              (!isAvailable || isImplicitDefaultElsewhere || !!ownerAgentId),
          };

          return {
            id: `${channelId}:${accountId}`,
            channel: channelId,
            accountId,
            channelOrder: Number(channelOrderMap.get(channelId) ?? 9999),
            accountOrder: Number(
              accountOrderMap.get(`${channelId}:${accountId}`) ?? 9999,
            ),
            label: resolveChannelAccountLabel({ channelId, account }),
            isAwaitingPairing: accountStatusInfo?.status !== "paired",
            canOpenWorkspace,
            canNavigateToOwnerAgent,
            ownerAgentId,
            ownerAgentName,
            accountStatusInfo,
            accountData,
            isOwned,
            isAvailable,
            dimmedLabel: accountData.isBoundElsewhere,
            isBoundElsewhere: accountData.isBoundElsewhere,
          };
        });
      })
      .filter(Boolean)
      .sort((a, b) => {
        const rankDiff = getChannelItemSortRank(a) - getChannelItemSortRank(b);
        if (rankDiff !== 0) return rankDiff;
        const channelOrderDiff =
          Number(a?.channelOrder ?? 9999) - Number(b?.channelOrder ?? 9999);
        if (channelOrderDiff !== 0) return channelOrderDiff;
        const accountOrderDiff =
          Number(a?.accountOrder ?? 9999) - Number(b?.accountOrder ?? 9999);
        if (accountOrderDiff !== 0) return accountOrderDiff;
        return String(a?.label || "").localeCompare(String(b?.label || ""));
      });
  }, [
    agentId,
    agentNameMap,
    channelStatus,
    configuredChannelMap,
    configuredChannels,
    defaultAgentId,
    isDefaultAgent,
  ]);

  const visibleChannelItems = channelItemData.filter(
    (item) => !item?.isBoundElsewhere,
  );
  const assignedElsewhereItems = channelItemData.filter(
    (item) => !!item?.isBoundElsewhere,
  );

  useEffect(() => {
    if (assignedElsewhereItems.length === 0) {
      setShowAssignedElsewhere(false);
      return;
    }
    if (visibleChannelItems.length === 0) {
      setShowAssignedElsewhere(true);
    }
  }, [agentId, assignedElsewhereItems.length, visibleChannelItems.length]);

  const mergedChannelItems = useMemo(() => {
    const baseItems = [...visibleChannelItems];
    if (assignedElsewhereItems.length === 0) return baseItems;
    baseItems.push({
      id: "__assigned_elsewhere_toggle",
      label: html`
        <span class="inline-flex items-center gap-1.5">
          <span class=${`arrow inline-block ${showAssignedElsewhere ? "" : "-rotate-90"}`}>▼</span>
          <span>Assigned elsewhere</span>
        </span>
      `,
      labelClassName: "text-xs",
      clickable: true,
      onClick: () => setShowAssignedElsewhere((current) => !current),
      dimmedLabel: true,
      trailing: html`
        <span class="inline-flex items-center gap-1.5 text-gray-500">
          <span class="text-[11px] px-2 py-0.5 rounded-full border border-border">
            ${assignedElsewhereItems.length}
          </span>
        </span>
      `,
    });
    if (showAssignedElsewhere) {
      baseItems.push(...assignedElsewhereItems);
    }
    return baseItems;
  }, [assignedElsewhereItems, showAssignedElsewhere, visibleChannelItems]);

  return {
    mergedChannelItems,
  };
};
