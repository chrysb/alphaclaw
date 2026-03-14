import { h } from "https://esm.sh/preact";
import { useEffect, useRef, useState } from "https://esm.sh/preact/hooks";
import htm from "https://esm.sh/htm";
import {
  AddLineIcon,
  AlarmLineIcon,
  BarChartLineIcon,
  Brain2LineIcon,
  BracesLineIcon,
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
import { readUiSettings, writeUiSettings } from "../lib/ui-settings.js";

const html = htm.bind(h);
const kBrowseBottomPanelUiSettingKey = "browseBottomPanelHeightPx";
const kBrowsePanelMinHeightPx = 120;
const kBrowseBottomMinHeightPx = 120;
const kBrowseResizerHeightPx = 6;
const kDefaultBrowseBottomPanelHeightPx = 260;
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

const getAgentIdentityEmoji = (agent) => String(agent?.identity?.emoji || "").trim();

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
  acLatest = "",
  acUpdating = false,
  onAcUpdate = () => {},
  agents = [],
  selectedAgentId = "",
  onSelectAgent = () => {},
  onAddAgent = () => {},
}) => {
  const browseLayoutRef = useRef(null);
  const browseBottomPanelRef = useRef(null);
  const browseResizeStartRef = useRef({ startY: 0, startHeight: 0 });
  const [browseBottomPanelHeightPx, setBrowseBottomPanelHeightPx] = useState(
    readStoredBrowseBottomPanelHeight,
  );
  const [isResizingBrowsePanels, setIsResizingBrowsePanels] = useState(false);
  const [updateModalOpen, setUpdateModalOpen] = useState(false);

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
      <img src="./img/logo.svg" alt="" width="20" height="20" />
      <span><span style="color: var(--accent)">alpha</span>claw</span>
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
        ${acHasUpdate && acLatest
          ? html`
              <${UpdateActionButton}
                onClick=${() => setUpdateModalOpen(true)}
                loading=${acUpdating}
                warning=${true}
                idleLabel=${`Update to v${acLatest}`}
                loadingLabel="Updating..."
                className="w-full justify-center"
              />
            `
          : null}
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
      version=${acLatest}
      onUpdate=${onAcUpdate}
      updating=${acUpdating}
    />
  </div>
`;
};
