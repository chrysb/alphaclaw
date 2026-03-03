import { h } from "https://esm.sh/preact";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "https://esm.sh/preact/hooks";
import htm from "https://esm.sh/htm";
import { fetchBrowseTree } from "../lib/api.js";
import {
  kDraftIndexChangedEventName,
  readStoredDraftPaths,
} from "../lib/browse-draft-state.js";
import { collectAncestorFolderPaths } from "../lib/file-tree-utils.js";
import {
  MarkdownFillIcon,
  JavascriptFillIcon,
  File3LineIcon,
  Image2FillIcon,
  TerminalFillIcon,
  BracesLineIcon,
  FileCodeLineIcon,
  Database2LineIcon,
  HashtagIcon,
  LockLineIcon,
} from "./icons.js";
import { LoadingSpinner } from "./loading-spinner.js";

const html = htm.bind(h);
const kTreeIndentPx = 9;
const kFolderBasePaddingPx = 10;
const kFileBasePaddingPx = 14;
const kTreeRefreshIntervalMs = 5000;
const kCollapsedFoldersStorageKey = "alphaclaw.browse.collapsedFolders";
const kLegacyCollapsedFoldersStorageKey = "alphaclawBrowseCollapsedFolders";
const kLockedBrowsePaths = new Set([
  "hooks/bootstrap/agents.md",
  "hooks/bootstrap/tools.md",
  ".alphaclaw/hourly-git-sync.sh",
  ".alphaclaw/.cli-device-auto-approved",
]);

const normalizePolicyPath = (inputPath) =>
  String(inputPath || "")
    .replaceAll("\\", "/")
    .replace(/^\.\/+/, "")
    .replace(/^\/+/, "")
    .trim()
    .toLowerCase();

const matchesPolicyPath = (policyPathSet, normalizedPath) => {
  const safeNormalizedPath = String(normalizedPath || "").trim();
  if (!safeNormalizedPath) return false;
  for (const policyPath of policyPathSet) {
    if (
      safeNormalizedPath === policyPath ||
      safeNormalizedPath.endsWith(`/${policyPath}`)
    ) {
      return true;
    }
  }
  return false;
};

const readStoredCollapsedPaths = () => {
  try {
    const rawValue =
      window.localStorage.getItem(kCollapsedFoldersStorageKey) ||
      window.localStorage.getItem(kLegacyCollapsedFoldersStorageKey);
    if (!rawValue) return null;
    const parsedValue = JSON.parse(rawValue);
    if (!Array.isArray(parsedValue)) return null;
    return new Set(parsedValue.map((entry) => String(entry)));
  } catch {
    return null;
  }
};

const collectFolderPaths = (node, folderPaths) => {
  if (!node || node.type !== "folder") return;
  if (node.path) folderPaths.add(node.path);
  (node.children || []).forEach((childNode) =>
    collectFolderPaths(childNode, folderPaths),
  );
};

const collectFilePaths = (node, filePaths) => {
  if (!node) return;
  if (node.type === "file") {
    if (node.path) filePaths.push(node.path);
    return;
  }
  (node.children || []).forEach((childNode) =>
    collectFilePaths(childNode, filePaths),
  );
};

const filterTreeNode = (node, normalizedQuery) => {
  if (!node) return null;
  const query = String(normalizedQuery || "").trim().toLowerCase();
  if (!query) return node;
  const nodeName = String(node.name || "").toLowerCase();
  const nodePath = String(node.path || "").toLowerCase();
  const isDirectMatch = nodeName.includes(query) || nodePath.includes(query);
  if (node.type === "file") {
    return isDirectMatch ? node : null;
  }
  const filteredChildren = (node.children || [])
    .map((childNode) => filterTreeNode(childNode, query))
    .filter(Boolean);
  if (!isDirectMatch && filteredChildren.length === 0) return null;
  return {
    ...node,
    children: filteredChildren,
  };
};

const getFileIconMeta = (fileName) => {
  const normalizedName = String(fileName || "").toLowerCase();
  if (normalizedName.endsWith(".md")) {
    return {
      icon: MarkdownFillIcon,
      className: "file-icon file-icon-md",
    };
  }
  if (normalizedName.endsWith(".js") || normalizedName.endsWith(".mjs")) {
    return {
      icon: JavascriptFillIcon,
      className: "file-icon file-icon-js",
    };
  }
  if (normalizedName.endsWith(".json") || normalizedName.endsWith(".jsonl")) {
    return {
      icon: BracesLineIcon,
      className: "file-icon file-icon-json",
    };
  }
  if (normalizedName.endsWith(".css") || normalizedName.endsWith(".scss")) {
    return {
      icon: HashtagIcon,
      className: "file-icon file-icon-css",
    };
  }
  if (/\.(html?)$/i.test(normalizedName)) {
    return {
      icon: FileCodeLineIcon,
      className: "file-icon file-icon-html",
    };
  }
  if (/\.(png|jpe?g|gif|webp|svg|bmp|ico|avif)$/i.test(normalizedName)) {
    return {
      icon: Image2FillIcon,
      className: "file-icon file-icon-image",
    };
  }
  if (
    /\.(sh|bash|zsh|command)$/i.test(normalizedName) ||
    [
      ".bashrc",
      ".zshrc",
      ".profile",
      ".bash_profile",
      ".zprofile",
      ".zshenv",
    ].includes(normalizedName)
  ) {
    return {
      icon: TerminalFillIcon,
      className: "file-icon file-icon-shell",
    };
  }
  if (
    /\.(db|sqlite|sqlite3|db3|sdb|sqlitedb|duckdb|mdb|accdb)$/i.test(
      normalizedName,
    )
  ) {
    return {
      icon: Database2LineIcon,
      className: "file-icon file-icon-db",
    };
  }
  return {
    icon: File3LineIcon,
    className: "file-icon file-icon-generic",
  };
};

const TreeNode = ({
  node,
  depth = 0,
  collapsedPaths,
  onToggleFolder,
  onSelectFile,
  selectedPath = "",
  draftPaths,
  isSearchActive = false,
  searchActivePath = "",
}) => {
  if (!node) return null;
  if (node.type === "file") {
    const isActive = selectedPath === node.path;
    const isSearchActiveNode = searchActivePath === node.path;
    const hasDraft = draftPaths.has(node.path || "");
    const isLocked = matchesPolicyPath(
      kLockedBrowsePaths,
      normalizePolicyPath(node.path || ""),
    );
    const fileIconMeta = getFileIconMeta(node.name);
    const FileTypeIcon = fileIconMeta.icon;
    return html`
      <li class="tree-item">
        <a
          class=${`${isActive ? "active" : ""} ${isSearchActiveNode && !isActive ? "soft-active" : ""}`.trim()}
          onclick=${() => onSelectFile(node.path)}
          style=${{
            paddingLeft: `${kFileBasePaddingPx + depth * kTreeIndentPx}px`,
          }}
          title=${node.path || node.name}
        >
          <${FileTypeIcon} className=${fileIconMeta.className} />
          <span class="tree-label">${node.name}</span>
          ${isLocked
            ? html`<${LockLineIcon}
                className="tree-lock-icon"
                title="Managed by Alpha Claw"
              />`
            : hasDraft
              ? html`<span class="tree-draft-dot" aria-hidden="true"></span>`
              : null}
        </a>
      </li>
    `;
  }

  const folderPath = node.path || "";
  const isCollapsed = isSearchActive ? false : collapsedPaths.has(folderPath);
  return html`
    <li class="tree-item">
      <div
        class=${`tree-folder ${isCollapsed ? "collapsed" : ""}`}
        onclick=${() => onToggleFolder(folderPath)}
        style=${{
          paddingLeft: `${kFolderBasePaddingPx + depth * kTreeIndentPx}px`,
        }}
        title=${folderPath || node.name}
      >
        <span class="arrow">▼</span>
        <span class="tree-label">${node.name}</span>
      </div>
      <ul class=${`tree-children ${isCollapsed ? "hidden" : ""}`}>
        ${(node.children || []).map(
          (childNode) => html`
            <${TreeNode}
              key=${childNode.path || `${folderPath}/${childNode.name}`}
              node=${childNode}
              depth=${depth + 1}
              collapsedPaths=${collapsedPaths}
              onToggleFolder=${onToggleFolder}
              onSelectFile=${onSelectFile}
              selectedPath=${selectedPath}
              draftPaths=${draftPaths}
              isSearchActive=${isSearchActive}
              searchActivePath=${searchActivePath}
            />
          `,
        )}
      </ul>
    </li>
  `;
};

export const FileTree = ({
  onSelectFile = () => {},
  selectedPath = "",
  onPreviewFile = () => {},
}) => {
  const [treeRoot, setTreeRoot] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [collapsedPaths, setCollapsedPaths] = useState(
    readStoredCollapsedPaths,
  );
  const [draftPaths, setDraftPaths] = useState(readStoredDraftPaths);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchActivePath, setSearchActivePath] = useState("");
  const searchInputRef = useRef(null);
  const treeSignatureRef = useRef("");

  const loadTree = useCallback(async ({ showLoading = false } = {}) => {
    if (showLoading) setLoading(true);
    if (showLoading) setError("");
    try {
      const data = await fetchBrowseTree();
      const nextRoot = data.root || null;
      const nextSignature = JSON.stringify(nextRoot || {});
      if (treeSignatureRef.current !== nextSignature) {
        treeSignatureRef.current = nextSignature;
        setTreeRoot(nextRoot);
      }
      setCollapsedPaths((previousPaths) => {
        if (previousPaths instanceof Set) return previousPaths;
        const nextPaths = new Set();
        collectFolderPaths(nextRoot, nextPaths);
        return nextPaths;
      });
      if (showLoading) setError("");
    } catch (loadError) {
      if (showLoading) {
        setError(loadError.message || "Could not load file tree");
      }
    } finally {
      if (showLoading) setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTree({ showLoading: true });
  }, [loadTree]);

  useEffect(() => {
    const refreshTree = () => {
      loadTree({ showLoading: false });
    };
    const refreshInterval = window.setInterval(
      refreshTree,
      kTreeRefreshIntervalMs,
    );
    window.addEventListener("alphaclaw:browse-file-saved", refreshTree);
    window.addEventListener("alphaclaw:browse-tree-refresh", refreshTree);
    return () => {
      window.clearInterval(refreshInterval);
      window.removeEventListener("alphaclaw:browse-file-saved", refreshTree);
      window.removeEventListener("alphaclaw:browse-tree-refresh", refreshTree);
    };
  }, [loadTree]);

  const normalizedSearchQuery = String(searchQuery || "").trim().toLowerCase();
  const rootChildren = useMemo(() => {
    const children = treeRoot?.children || [];
    if (!normalizedSearchQuery) return children;
    return children
      .map((node) => filterTreeNode(node, normalizedSearchQuery))
      .filter(Boolean);
  }, [treeRoot, normalizedSearchQuery]);
  const safeCollapsedPaths =
    collapsedPaths instanceof Set ? collapsedPaths : new Set();
  const isSearchActive = normalizedSearchQuery.length > 0;
  const filteredFilePaths = useMemo(() => {
    const filePaths = [];
    rootChildren.forEach((node) => collectFilePaths(node, filePaths));
    return filePaths;
  }, [rootChildren]);

  useEffect(() => {
    if (!(collapsedPaths instanceof Set)) return;
    try {
      window.localStorage.setItem(
        kCollapsedFoldersStorageKey,
        JSON.stringify(Array.from(collapsedPaths)),
      );
    } catch {}
  }, [collapsedPaths]);

  useEffect(() => {
    if (!selectedPath) return;
    const ancestorFolderPaths = collectAncestorFolderPaths(selectedPath);
    if (!ancestorFolderPaths.length) return;
    setCollapsedPaths((previousPaths) => {
      if (!(previousPaths instanceof Set)) return previousPaths;
      let didChange = false;
      const nextPaths = new Set(previousPaths);
      ancestorFolderPaths.forEach((ancestorPath) => {
        if (nextPaths.has(ancestorPath)) {
          nextPaths.delete(ancestorPath);
          didChange = true;
        }
      });
      return didChange ? nextPaths : previousPaths;
    });
  }, [selectedPath]);

  useEffect(() => {
    const handleDraftIndexChanged = (event) => {
      const eventPaths = event?.detail?.paths;
      if (Array.isArray(eventPaths)) {
        setDraftPaths(
          new Set(
            eventPaths
              .map((entry) => String(entry || "").trim())
              .filter(Boolean),
          ),
        );
        return;
      }
      setDraftPaths(readStoredDraftPaths());
    };
    window.addEventListener(kDraftIndexChangedEventName, handleDraftIndexChanged);
    window.addEventListener("storage", handleDraftIndexChanged);
    return () => {
      window.removeEventListener(kDraftIndexChangedEventName, handleDraftIndexChanged);
      window.removeEventListener("storage", handleDraftIndexChanged);
    };
  }, []);

  useEffect(() => {
    const handleGlobalSearchShortcut = (event) => {
      if (event.key !== "/") return;
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      const target = event.target;
      const tagName = String(target?.tagName || "").toLowerCase();
      const isTypingTarget =
        tagName === "input" ||
        tagName === "textarea" ||
        tagName === "select" ||
        target?.isContentEditable;
      if (isTypingTarget && target !== searchInputRef.current) return;
      event.preventDefault();
      searchInputRef.current?.focus();
      searchInputRef.current?.select();
    };
    window.addEventListener("keydown", handleGlobalSearchShortcut);
    return () => {
      window.removeEventListener("keydown", handleGlobalSearchShortcut);
    };
  }, []);

  useEffect(() => {
    if (!isSearchActive) {
      setSearchActivePath("");
      onPreviewFile("");
      return;
    }
    if (searchActivePath && filteredFilePaths.includes(searchActivePath)) return;
    setSearchActivePath("");
    onPreviewFile("");
  }, [isSearchActive, filteredFilePaths, searchActivePath, onPreviewFile]);

  const toggleFolder = (folderPath) => {
    setCollapsedPaths((previousPaths) => {
      const nextPaths =
        previousPaths instanceof Set ? new Set(previousPaths) : new Set();
      if (nextPaths.has(folderPath)) nextPaths.delete(folderPath);
      else nextPaths.add(folderPath);
      return nextPaths;
    });
  };

  const updateSearchQuery = (nextQuery) => {
    setSearchQuery(nextQuery);
  };

  const clearSearch = () => {
    setSearchQuery("");
    setSearchActivePath("");
    onPreviewFile("");
  };

  const moveSearchSelection = (direction) => {
    if (!filteredFilePaths.length) return;
    const currentIndex = filteredFilePaths.indexOf(searchActivePath);
    const delta = direction === "up" ? -1 : 1;
    const baseIndex = currentIndex === -1 ? (direction === "up" ? 0 : -1) : currentIndex;
    const nextIndex =
      (baseIndex + delta + filteredFilePaths.length) % filteredFilePaths.length;
    const nextPath = filteredFilePaths[nextIndex];
    setSearchActivePath(nextPath);
    onPreviewFile(nextPath);
  };

  const commitSearchSelection = () => {
    const [singlePath = ""] = filteredFilePaths;
    const targetPath = searchActivePath || (filteredFilePaths.length === 1 ? singlePath : "");
    if (!targetPath) return;
    onSelectFile(targetPath);
    clearSearch();
  };

  const onSearchKeyDown = (event) => {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      moveSearchSelection("down");
      return;
    }
    if (event.key === "ArrowUp") {
      event.preventDefault();
      moveSearchSelection("up");
      return;
    }
    if (event.key === "Enter") {
      event.preventDefault();
      commitSearchSelection();
      return;
    }
    if (event.key === "Escape") {
      event.preventDefault();
      clearSearch();
    }
  };

  if (loading) {
    return html`
      <div class="file-tree-wrap file-tree-wrap-loading">
        <div class="file-tree-state file-tree-state-loading">
          <${LoadingSpinner} className="h-5 w-5 text-gray-400" />
        </div>
      </div>
    `;
  }
  if (error) {
    return html`<div class="file-tree-state file-tree-state-error">
      ${error}
    </div>`;
  }
  if (!rootChildren.length) {
    return html`
      <div class="file-tree-wrap">
        <div class="file-tree-search">
          <input
            class="file-tree-search-input"
            type="text"
            ref=${searchInputRef}
            value=${searchQuery}
            onInput=${(event) => updateSearchQuery(event.target.value)}
            onKeyDown=${onSearchKeyDown}
            placeholder="Search files..."
            autocomplete="off"
            spellcheck=${false}
          />
        </div>
        <div class="file-tree-state">
          ${isSearchActive ? "No matching files." : "No files found."}
        </div>
      </div>
    `;
  }

  return html`
    <div class="file-tree-wrap">
      <div class="file-tree-search">
        <input
          class="file-tree-search-input"
          type="text"
          ref=${searchInputRef}
          value=${searchQuery}
          onInput=${(event) => updateSearchQuery(event.target.value)}
          onKeyDown=${onSearchKeyDown}
          placeholder="Search files..."
          autocomplete="off"
          spellcheck=${false}
        />
      </div>
      <ul class="file-tree">
        ${rootChildren.map(
          (node) => html`
            <${TreeNode}
              key=${node.path || node.name}
              node=${node}
              collapsedPaths=${safeCollapsedPaths}
              onToggleFolder=${toggleFolder}
              onSelectFile=${onSelectFile}
              selectedPath=${selectedPath}
              draftPaths=${draftPaths}
              isSearchActive=${isSearchActive}
              searchActivePath=${searchActivePath}
            />
          `,
        )}
      </ul>
    </div>
  `;
};
