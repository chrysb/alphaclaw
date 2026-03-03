import { h } from "https://esm.sh/preact";
import { useEffect, useRef, useState } from "https://esm.sh/preact/hooks";
import htm from "https://esm.sh/htm";
import { HomeLineIcon, FolderLineIcon } from "./icons.js";
import { FileTree } from "./file-tree.js";
import { UpdateActionButton } from "./update-action-button.js";
import { SidebarGitPanel } from "./sidebar-git-panel.js";
import { readUiSettings, writeUiSettings } from "../lib/ui-settings.js";

const html = htm.bind(h);
const kBrowseBottomPanelUiSettingKey = "browseBottomPanelHeightPx";
const kBrowsePanelMinHeightPx = 120;
const kBrowseBottomMinHeightPx = 120;
const kBrowseResizerHeightPx = 6;
const kDefaultBrowseBottomPanelHeightPx = 160;

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
  acDismissed = false,
  acUpdating = false,
  onAcUpdate = () => {},
}) => {
  const browseLayoutRef = useRef(null);
  const browseBottomPanelRef = useRef(null);
  const browseResizeStartRef = useRef({ startY: 0, startHeight: 0 });
  const [browseBottomPanelHeightPx, setBrowseBottomPanelHeightPx] = useState(
    readStoredBrowseBottomPanelHeight,
  );
  const [isResizingBrowsePanels, setIsResizingBrowsePanels] = useState(false);

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

  return html`
    <div class=${`app-sidebar ${mobileSidebarOpen ? "mobile-open" : ""}`}>
    <div class="sidebar-brand">
      <img src="./img/logo.svg" alt="" width="20" height="20" />
      <span><span style="color: var(--accent)">alpha</span>claw</span>
      ${authEnabled && html`
        <div class="brand-menu" ref=${menuRef}>
          <button
            class="brand-menu-trigger"
            onclick=${onToggleMenu}
            aria-label="Menu"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
              <circle cx="8" cy="3" r="1.5" />
              <circle cx="8" cy="8" r="1.5" />
              <circle cx="8" cy="13" r="1.5" />
            </svg>
          </button>
          ${menuOpen && html`
            <div class="brand-dropdown">
              <a
                href="#"
                onclick=${(event) => {
                  event.preventDefault();
                  onLogout();
                }}
              >Log out</a>
            </div>
          `}
        </div>
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
    <div style=${{ display: sidebarTab === "menu" ? "block" : "none" }}>
      ${navSections.map(
        (section) => html`
          <div class="sidebar-label">${section.label}</div>
          <nav class="sidebar-nav">
            ${section.items.map(
              (item) => html`
                <a
                  class=${selectedNavId === item.id ? "active" : ""}
                  onclick=${() => onSelectNavItem(item.id)}
                >
                  ${item.label}
                </a>
              `,
            )}
          </nav>
        `,
      )}
      <div class="sidebar-footer">
        ${acHasUpdate && acLatest && !acDismissed
          ? html`
              <${UpdateActionButton}
                onClick=${onAcUpdate}
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
    <div style=${{ display: sidebarTab === "browse" ? "block" : "none" }}>
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
          ${acHasUpdate && acLatest && !acDismissed
            ? html`
                <${UpdateActionButton}
                  onClick=${onAcUpdate}
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
      </div>
    </div>
  </div>
`;
};
