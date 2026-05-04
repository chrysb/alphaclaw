import { h } from "preact";
import { useEffect, useMemo, useRef, useState } from "preact/hooks";
import htm from "htm";
import {
  AddLineIcon,
  AlarmLineIcon,
  BarChartLineIcon,
  Brain2LineIcon,
  BracesLineIcon,
  Chat4LineIcon,
  ChevronDownIcon,
  ComputerLineIcon,
  EyeLineIcon,
  FolderLineIcon,
  HomeLineIcon,
  PulseLineIcon,
  RobotLineIcon,
  SignalTowerLineIcon,
} from "./icons.js";
import { FileTree } from "./file-tree.js";
import { OverflowMenu, OverflowMenuItem } from "./overflow-menu.js";
import { UpdateActionButton } from "./update-action-button.js";
import { SidebarGitPanel } from "./sidebar-git-panel.js";
import { UpdateModal } from "./update-modal.js";
import {
  readUiSettings,
  updateUiSettings,
  writeUiSettings,
} from "../lib/ui-settings.js";
import {
  getAgentIdFromSessionKey,
  getSessionChannelForIcon,
  getSessionDisplayLabel,
  getSessionRowKey,
} from "../lib/session-keys.js";
import { sanitizeAgentEmoji } from "../lib/agent-identity.js";
import { ThemeToggle } from "./theme-toggle.js";

const html = htm.bind(h);
const kBrowseBottomPanelUiSettingKey = "browseBottomPanelHeightPx";
const kBrowsePanelMinHeightPx = 120;
const kBrowseBottomMinHeightPx = 120;
const kBrowseResizerHeightPx = 6;
const kDefaultBrowseBottomPanelHeightPx = 260;
const kChatSidebarCollapsedAgentIdsKey = "chatSidebarCollapsedAgentIds";
const kChatChannelIconSrc = {
  telegram: "/assets/icons/telegram.svg",
  discord: "/assets/icons/discord.svg",
  slack: "/assets/icons/slack.svg",
};
const readChatSidebarCollapsedAgentIds = () => {
  const raw = readUiSettings()[kChatSidebarCollapsedAgentIdsKey];
  return Array.isArray(raw) ? raw : [];
};
const kSidebarNavIconsById = {
  cron: AlarmLineIcon,
  usage: BarChartLineIcon,
  doctor: PulseLineIcon,
  watchdog: EyeLineIcon,
  models: Brain2LineIcon,
  envars: BracesLineIcon,
  webhooks: SignalTowerLineIcon,
  nodes: ComputerLineIcon,
};

const readStoredBrowseBottomPanelHeight = () => {
  try {
    const settings = readUiSettings();
    const fromSharedSettings = Number.parseInt(
      String(settings?.[kBrowseBottomPanelUiSettingKey] || ""),
      10,
    );
    if (Number.isFinite(fromSharedSettings) && fromSharedSettings > 0) {
      return fromSharedSettings;
    }
    return kDefaultBrowseBottomPanelHeightPx;
  } catch {
    return kDefaultBrowseBottomPanelHeightPx;
  }
};

const renderNavItem = ({ item, selectedNavId, onSelectNavItem }) => {
  const NavIcon = kSidebarNavIconsById[item.id] || null;
  return html`
    <a
      class=${selectedNavId === item.id ? "active" : ""}
      onclick=${() => onSelectNavItem(item.id)}
    >
      ${NavIcon ? html`<${NavIcon} className="sidebar-nav-icon" />` : null}
      <span>${item.label}</span>
    </a>
  `;
};

const getAgentIdentityEmoji = (agent) => sanitizeAgentEmoji(agent?.identity?.emoji);

export const AppSidebar = ({
  mobileSidebarOpen = false,
  authEnabled = false,
  menuRef = null,
  menuOpen = false,
  onToggleMenu = () => {},
  onLogout = () => {},
  sidebarTab = "menu",
  onSelectSidebarTab = () => {},
  navSections = [],
  selectedNavId = "",
  onSelectNavItem = () => {},
  selectedBrowsePath = "",
  onSelectBrowseFile = () => {},
  onPreviewBrowseFile = () => {},
  acHasUpdate = false,
  acVersion = "",
  acCurrentOpenclawVersion = "",
  acLatest = "",
  acLatestOpenclawVersion = "",
  acUpdateStrategy = null,
  acUpdating = false,
  onAcUpdate = () => {},
  agents = [],
  selectedAgentId = "",
  onSelectAgent = () => {},
  onAddAgent = () => {},
  chatSessions = [],
  selectedChatSessionKey = "",
  onSelectChatSession = () => {},
}) => {
  const browseLayoutRef = useRef(null);
  const browseBottomPanelRef = useRef(null);
  const browseResizeStartRef = useRef({ startY: 0, startHeight: 0 });
  const [browseBottomPanelHeightPx, setBrowseBottomPanelHeightPx] = useState(
    readStoredBrowseBottomPanelHeight,
  );
  const [isResizingBrowsePanels, setIsResizingBrowsePanels] = useState(false);
  const [updateModalOpen, setUpdateModalOpen] = useState(false);
  const [collapsedChatAgentIds, setCollapsedChatAgentIds] = useState(() =>
    readChatSidebarCollapsedAgentIds(),
  );

  const chatSessionGroups = useMemo(() => {
    const rows = Array.isArray(chatSessions) ? chatSessions : [];
    const order = [];
    const byAgent = new Map();
    for (const row of rows) {
      const aid = String(
        row.agentId ||
          getAgentIdFromSessionKey(getSessionRowKey(row)) ||
          "unknown",
      );
      if (!byAgent.has(aid)) {
        byAgent.set(aid, {
          agentId: aid,
          agentLabel: String(row.agentLabel || "").trim() || aid,
          sessions: [],
        });
        order.push(aid);
      }
      byAgent.get(aid).sessions.push(row);
    }
    const groups = order.map((aid) => byAgent.get(aid));
    groups.sort((a, b) => {
      if (a.agentId === "main" && b.agentId !== "main") return -1;
      if (b.agentId === "main" && a.agentId !== "main") return 1;
      return a.agentLabel.localeCompare(b.agentLabel);
    });
    return groups;
  }, [chatSessions]);

  const toggleChatAgentCollapsed = (agentId) => {
    const id = String(agentId || "");
    setCollapsedChatAgentIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      const arr = Array.from(next);
      updateUiSettings((s) => ({
        ...s,
        [kChatSidebarCollapsedAgentIdsKey]: arr,
      }));
      return arr;
    });
  };

  useEffect(() => {
    const settings = readUiSettings();
    settings[kBrowseBottomPanelUiSettingKey] = browseBottomPanelHeightPx;
    writeUiSettings(settings);
  }, [browseBottomPanelHeightPx]);

  const getClampedBrowseBottomPanelHeight = (value) => {
    const layoutElement = browseLayoutRef.current;
    if (!layoutElement) return value;
    const layoutRect = layoutElement.getBoundingClientRect();
    const maxHeight = Math.max(
      kBrowseBottomMinHeightPx,
      layoutRect.height - kBrowsePanelMinHeightPx - kBrowseResizerHeightPx,
    );
    return Math.max(
      kBrowseBottomMinHeightPx,
      Math.min(maxHeight, value),
    );
  };

  const resizeBrowsePanelWithClientY = (clientY) => {
    const { startY, startHeight } = browseResizeStartRef.current;
    const proposedHeight = startHeight + (startY - clientY);
    setBrowseBottomPanelHeightPx(getClampedBrowseBottomPanelHeight(proposedHeight));
  };

  useEffect(() => {
    const layoutElement = browseLayoutRef.current;
    if (!layoutElement || typeof ResizeObserver === "undefined") return () => {};
    const observer = new ResizeObserver(() => {
      const layoutRect = layoutElement.getBoundingClientRect();
      if (layoutRect.height <= 0) return;
      setBrowseBottomPanelHeightPx((currentHeight) =>
        getClampedBrowseBottomPanelHeight(currentHeight),
      );
    });
    observer.observe(layoutElement);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!isResizingBrowsePanels) return () => {};
    const handlePointerMove = (event) => resizeBrowsePanelWithClientY(event.clientY);
    const handlePointerUp = () => setIsResizingBrowsePanels(false);
    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);
    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
    };
  }, [isResizingBrowsePanels]);

  const onBrowsePanelResizerPointerDown = (event) => {
    event.preventDefault();
    const measuredHeight =
      browseBottomPanelRef.current?.getBoundingClientRect().height ||
      browseBottomPanelHeightPx;
    browseResizeStartRef.current = {
      startY: event.clientY,
      startHeight: measuredHeight,
    };
    setBrowseBottomPanelHeightPx(getClampedBrowseBottomPanelHeight(measuredHeight));
    setIsResizingBrowsePanels(true);
  };

  const setupSection = navSections.find((section) => section.label === "Setup") || null;
  const remainingSections = navSections.filter((section) => section.label !== "Setup");

  return html`
    <div class=${`app-sidebar ${mobileSidebarOpen ? "mobile-open" : ""}`}>
    <div class="sidebar-brand">
      <span
        class="ac-logo-mark"
        style="--ac-logo-width: 20px; --ac-logo-height: 20px;"
        aria-hidden="true"
      ></span>
      <span><span style="color: var(--accent)">alpha</span>claw</span>
      <span style="margin-left: auto; display: inline-flex; align-items: center; gap: 4px;">
        <${ThemeToggle} />
      ${authEnabled && html`
        <${OverflowMenu}
          open=${menuOpen}
          onToggle=${onToggleMenu}
          onClose=${onToggleMenu}
          ariaLabel="Menu"
          title="Menu"
          menuRef=${menuRef}
        >
          <${OverflowMenuItem} onClick=${() => onLogout()}>
            Log out
          </${OverflowMenuItem}>
        </${OverflowMenu}>
      `}
      </span>
    </div>
    <div class="sidebar-tabs">
      <button
        class=${`sidebar-tab ${sidebarTab === "menu" ? "active" : ""}`}
        aria-label="Menu tab"
        title="Menu"
        onclick=${() => onSelectSidebarTab("menu")}
      >
        <${HomeLineIcon} className="sidebar-tab-icon" />
      </button>
      <button
        class=${`sidebar-tab ${sidebarTab === "browse" ? "active" : ""}`}
        aria-label="Browse tab"
        title="Browse"
        onclick=${() => onSelectSidebarTab("browse")}
      >
        <${FolderLineIcon} className="sidebar-tab-icon" />
      </button>
      <button
        class=${`sidebar-tab ${sidebarTab === "chat" ? "active" : ""}`}
        aria-label="Chat tab"
        title="Chat"
        onclick=${() => onSelectSidebarTab("chat")}
      >
        <${Chat4LineIcon} className="sidebar-tab-icon" />
      </button>
    </div>
    <div
      style=${{
        display: sidebarTab === "menu" ? "flex" : "none",
        flexDirection: "column",
        flex: "1 1 auto",
        minHeight: 0,
      }}
    >
      ${setupSection
        ? html`
            <div class="sidebar-label">Menu</div>
            <nav class="sidebar-nav">
              ${setupSection.items.map((item) =>
                renderNavItem({ item, selectedNavId, onSelectNavItem }),
              )}
            </nav>
          `
        : null}
      <div class="sidebar-agents-header">
        <div class="sidebar-label sidebar-agents-label">Agents</div>
        <button
          type="button"
          class="sidebar-agents-add-button"
          onclick=${onAddAgent}
          title="Add agent"
          aria-label="Add agent"
        >
          <${AddLineIcon} className="sidebar-agents-add-icon" />
        </button>
      </div>
      <div class="sidebar-agents-list">
        ${agents.map(
          (agent) => {
            const identityEmoji = getAgentIdentityEmoji(agent);
            return html`
              <button
                key=${agent.id}
                class=${`sidebar-agent-item ${selectedAgentId === agent.id ? "active" : ""}`}
                onclick=${() => onSelectAgent(agent.id)}
              >
                ${identityEmoji
                  ? html`<span class="sidebar-agent-emoji" aria-hidden="true">${identityEmoji}</span>`
                  : html`<${RobotLineIcon} className="sidebar-agent-icon" />`}
                <span class="sidebar-agent-name">${agent.name || agent.id}</span>
              </button>
            `;
          },
        )}
      </div>
      ${remainingSections.map(
        (section) => html`
          <div class="sidebar-label">${section.label}</div>
          <nav class="sidebar-nav">
            ${section.items.map((item) =>
              renderNavItem({ item, selectedNavId, onSelectNavItem }),
            )}
          </nav>
        `,
      )}
      <div class="sidebar-footer">
        ${acHasUpdate
          ? html`
              <${UpdateActionButton}
                onClick=${() => setUpdateModalOpen(true)}
                loading=${acUpdating}
                warning=${true}
                idleLabel="Update available"
                loadingLabel="Updating..."
                className="w-full justify-center"
              />
            `
          : null}
      </div>
    </div>
    <div
      style=${{
        display: sidebarTab === "chat" ? "flex" : "none",
        flexDirection: "column",
        flex: "1 1 auto",
        minHeight: 0,
      }}
    >
      <div class="sidebar-chat-header">
        <div class="sidebar-label sidebar-chat-label">Sessions</div>
      </div>
      <div class="sidebar-chat-sessions-list">
        ${chatSessions.length === 0
          ? html`<div class="sidebar-chat-empty">No sessions found</div>`
          : chatSessionGroups.map(
              (group) => html`
                <div key=${group.agentId} class="sidebar-chat-agent-group">
                  <button
                    type="button"
                    class="sidebar-chat-agent-toggle"
                    onclick=${() => toggleChatAgentCollapsed(group.agentId)}
                    aria-expanded=${!collapsedChatAgentIds.includes(
                      group.agentId,
                    )}
                  >
                    <span
                      class=${`sidebar-chat-agent-chevron ${collapsedChatAgentIds.includes(group.agentId) ? "is-collapsed" : ""}`}
                      aria-hidden="true"
                    >
                      <${ChevronDownIcon} className="sidebar-chat-agent-chevron-icon" />
                    </span>
                    <span class="sidebar-chat-agent-label">${group.agentLabel}</span>
                  </button>
                  ${collapsedChatAgentIds.includes(group.agentId)
                    ? null
                    : html`
                        <div class="sidebar-chat-agent-sessions">
                          ${group.sessions.map((sessionRow) => {
                            const displayLabel = getSessionDisplayLabel(sessionRow);
                            const channelIconSrc =
                              kChatChannelIconSrc[
                                String(
                                  getSessionChannelForIcon(sessionRow) || "",
                                ).toLowerCase()
                              ] || "";
                            return html`
                              <button
                                key=${sessionRow.key}
                                class=${`sidebar-chat-session-item ${selectedChatSessionKey === sessionRow.key ? "active" : ""}`}
                                onclick=${() =>
                                  onSelectChatSession(sessionRow.key)}
                                title=${displayLabel}
                              >
                                ${channelIconSrc
                                  ? html`<img
                                      src=${channelIconSrc}
                                      alt=""
                                      width="12"
                                      height="12"
                                      class="sidebar-chat-session-channel-icon"
                                    />`
                                  : null}
                                <span class="sidebar-chat-session-name"
                                  >${displayLabel}</span
                                >
                              </button>
                            `;
                          })}
                        </div>
                      `}
                </div>
              `,
            )}
      </div>
    </div>
    <div
      style=${{
        display: sidebarTab === "browse" ? "flex" : "none",
        flexDirection: "column",
        flex: "1 1 auto",
        minHeight: 0,
        overflow: "hidden",
      }}
    >
      <div class="sidebar-browse-layout" ref=${browseLayoutRef}>
        <div
          class="sidebar-browse-panel"
        >
          <${FileTree}
            onSelectFile=${onSelectBrowseFile}
            selectedPath=${selectedBrowsePath}
            onPreviewFile=${onPreviewBrowseFile}
            isActive=${sidebarTab === "browse"}
          />
        </div>
        <div
          class=${`sidebar-browse-resizer ${isResizingBrowsePanels ? "is-resizing" : ""}`}
          onpointerdown=${onBrowsePanelResizerPointerDown}
          role="separator"
          aria-orientation="horizontal"
          aria-label="Resize browse and git panels"
        ></div>
        <div class="sidebar-browse-bottom">
          <div
            class="sidebar-browse-bottom-inner"
            ref=${browseBottomPanelRef}
            style=${{ height: `${browseBottomPanelHeightPx}px` }}
          >
          <${SidebarGitPanel}
            onSelectFile=${onSelectBrowseFile}
            isActive=${sidebarTab === "browse"}
          />
          </div>
        </div>
      </div>
    </div>
    <${UpdateModal}
      visible=${updateModalOpen}
      onClose=${() => {
        if (acUpdating) return;
        setUpdateModalOpen(false);
      }}
      currentVersion=${acVersion}
      currentOpenclawVersion=${acCurrentOpenclawVersion}
      version=${acLatest}
      latestOpenclawVersion=${acLatestOpenclawVersion}
      updateStrategy=${acUpdateStrategy}
      onUpdate=${onAcUpdate}
      updating=${acUpdating}
    />
  </div>
`;
};
