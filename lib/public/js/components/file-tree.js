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
import { deleteBrowseFile } from "../lib/api.js";
import {
  kDraftIndexChangedEventName,
  readStoredDraftPaths,
} from "../lib/browse-draft-state.js";
import {
  kLockedBrowsePaths,
  kProtectedBrowsePaths,
  matchesBrowsePolicyPath,
  normalizeBrowsePolicyPath,
} from "../lib/browse-file-policies.js";
import { collectAncestorFolderPaths } from "../lib/file-tree-utils.js";
import {
  MarkdownFillIcon,
  JavascriptFillIcon,
  File3LineIcon,
  FileMusicLineIcon,
  Image2FillIcon,
  TerminalFillIcon,
  BracesLineIcon,
  FileCodeLineIcon,
  Database2LineIcon,
  HashtagIcon,
  LockLineIcon,
} from "./icons.js";
import { LoadingSpinner } from "./loading-spinner.js";
import { ConfirmDialog } from "./confirm-dialog.js";
import { showToast } from "./toast.js";

const html = htm.bind(h);
const kTreeIndentPx = 9;
const kFolderBasePaddingPx = 10;
const kFileBasePaddingPx = 14;
const kTreeRefreshIntervalMs = 5000;
const kExpandedFoldersStorageKey = "alphaclaw.browse.expandedFolders";

const readStoredExpandedPaths = () => {
  try {
    const rawValue = window.localStorage.getItem(kExpandedFoldersStorageKey);
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

const removeTreePath = (node, targetPath) => {
  if (!node) return null;
  const safeTargetPath = String(targetPath || "").trim();
  if (!safeTargetPath) return node;
  const nodePath = String(node.path || "").trim();
  if (nodePath === safeTargetPath) return null;
  if (node.type !== "folder") return node;
  const nextChildren = (node.children || [])
    .map((childNode) => removeTreePath(childNode, safeTargetPath))
    .filter(Boolean);
  if (nextChildren.length === (node.children || []).length) return node;
  return {
    ...node,
    children: nextChildren,
  };
};

const filterTreeNode = (node, normalizedQuery) => {
  if (!node) return null;
  const query = String(normalizedQuery || "")
    .trim()
    .toLowerCase();
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
  const normalizedNameWithoutBakSuffix = normalizedName.replace(/(\.bak)+$/i, "");
  if (normalizedNameWithoutBakSuffix.endsWith(".md")) {
    return {
      icon: MarkdownFillIcon,
      className: "file-icon file-icon-md",
    };
  }
  if (
    normalizedNameWithoutBakSuffix.endsWith(".js") ||
    normalizedNameWithoutBakSuffix.endsWith(".mjs")
  ) {
    return {
      icon: JavascriptFillIcon,
      className: "file-icon file-icon-js",
    };
  }
  if (
    normalizedNameWithoutBakSuffix.endsWith(".json") ||
    normalizedNameWithoutBakSuffix.endsWith(".jsonl")
  ) {
    return {
      icon: BracesLineIcon,
      className: "file-icon file-icon-json",
    };
  }
  if (
    normalizedNameWithoutBakSuffix.endsWith(".css") ||
    normalizedNameWithoutBakSuffix.endsWith(".scss")
  ) {
    return {
      icon: HashtagIcon,
      className: "file-icon file-icon-css",
    };
  }
  if (/\.(html?)$/i.test(normalizedNameWithoutBakSuffix)) {
    return {
      icon: FileCodeLineIcon,
      className: "file-icon file-icon-html",
    };
  }
  if (
    /\.(png|jpe?g|gif|webp|svg|bmp|ico|avif)$/i.test(
      normalizedNameWithoutBakSuffix,
    )
  ) {
    return {
      icon: Image2FillIcon,
      className: "file-icon file-icon-image",
    };
  }
  if (
    /\.(mp3|wav|ogg|oga|m4a|aac|flac|opus|weba)$/i.test(
      normalizedNameWithoutBakSuffix,
    )
  ) {
    return {
      icon: FileMusicLineIcon,
      className: "file-icon file-icon-audio",
    };
  }
  if (
    /\.(sh|bash|zsh|command)$/i.test(normalizedNameWithoutBakSuffix) ||
    [
      ".bashrc",
      ".zshrc",
      ".profile",
      ".bash_profile",
      ".zprofile",
      ".zshenv",
    ].includes(normalizedNameWithoutBakSuffix)
  ) {
    return {
      icon: TerminalFillIcon,
      className: "file-icon file-icon-shell",
    };
  }
  if (
    /\.(db|sqlite|sqlite3|db3|sdb|sqlitedb|duckdb|mdb|accdb)$/i.test(
      normalizedNameWithoutBakSuffix,
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
  expandedPaths,
  onSetFolderExpanded,
  onSelectFolder,
  onRequestDelete,
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
    const isLocked = matchesBrowsePolicyPath(
      kLockedBrowsePaths,
      normalizeBrowsePolicyPath(node.path || ""),
    );
    const fileIconMeta = getFileIconMeta(node.name);
    const FileTypeIcon = fileIconMeta.icon;
    return html`
      <li class="tree-item">
        <a
          class=${`${isActive ? "active" : ""} ${isSearchActiveNode && !isActive ? "soft-active" : ""}`.trim()}
          onclick=${() => onSelectFile(node.path)}
          onKeyDown=${(event) => {
            const isDeleteKey =
              event.key === "Delete" || event.key === "Backspace";
            if (!isDeleteKey || !isActive) return;
            event.preventDefault();
            onRequestDelete(node.path);
          }}
          tabindex="0"
          role="button"
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
                title="Managed by AlphaClaw"
              />`
            : hasDraft
              ? html`<span class="tree-draft-dot" aria-hidden="true"></span>`
              : null}
        </a>
      </li>
    `;
  }

  const folderPath = node.path || "";
  const isCollapsed = isSearchActive ? false : !expandedPaths.has(folderPath);
  const isFolderActive = selectedPath === folderPath;
  return html`
    <li class="tree-item">
      <div
        class=${`tree-folder ${isCollapsed ? "collapsed" : ""} ${isFolderActive ? "active" : ""}`.trim()}
        onclick=${() => {
          if (!folderPath) return;
          if (isFolderActive) {
            onSetFolderExpanded(folderPath, false);
            onSelectFolder("");
            return;
          }
          onSetFolderExpanded(folderPath, true);
          onSelectFolder(folderPath);
        }}
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
              expandedPaths=${expandedPaths}
              onSetFolderExpanded=${onSetFolderExpanded}
              onSelectFolder=${onSelectFolder}
              onRequestDelete=${onRequestDelete}
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
  isActive = true,
}) => {
  const [treeRoot, setTreeRoot] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [expandedPaths, setExpandedPaths] = useState(readStoredExpandedPaths);
  const [draftPaths, setDraftPaths] = useState(readStoredDraftPaths);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchActivePath, setSearchActivePath] = useState("");
  const [deleteTargetPath, setDeleteTargetPath] = useState("");
  const [deletingFile, setDeletingFile] = useState(false);
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
      setExpandedPaths((previousPaths) =>
        previousPaths instanceof Set ? previousPaths : new Set(),
      );
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
    if (!isActive) return () => {};
    const refreshTree = () => {
      loadTree({ showLoading: false });
    };
    const handleFileDeleted = (event) => {
      const deletedPath = String(event?.detail?.path || "").trim();
      if (!deletedPath) return;
      setTreeRoot((previousRoot) => removeTreePath(previousRoot, deletedPath));
    };
    refreshTree();
    const refreshInterval = window.setInterval(
      refreshTree,
      kTreeRefreshIntervalMs,
    );
    window.addEventListener("alphaclaw:browse-file-saved", refreshTree);
    window.addEventListener("alphaclaw:browse-tree-refresh", refreshTree);
    window.addEventListener("alphaclaw:browse-file-deleted", handleFileDeleted);
    return () => {
      window.clearInterval(refreshInterval);
      window.removeEventListener("alphaclaw:browse-file-saved", refreshTree);
      window.removeEventListener("alphaclaw:browse-tree-refresh", refreshTree);
      window.removeEventListener("alphaclaw:browse-file-deleted", handleFileDeleted);
    };
  }, [isActive, loadTree]);

  const normalizedSearchQuery = String(searchQuery || "")
    .trim()
    .toLowerCase();
  const rootChildren = useMemo(() => {
    const children = treeRoot?.children || [];
    if (!normalizedSearchQuery) return children;
    return children
      .map((node) => filterTreeNode(node, normalizedSearchQuery))
      .filter(Boolean);
  }, [treeRoot, normalizedSearchQuery]);
  const safeExpandedPaths =
    expandedPaths instanceof Set ? expandedPaths : new Set();
  const isSearchActive = normalizedSearchQuery.length > 0;
  const filteredFilePaths = useMemo(() => {
    const filePaths = [];
    rootChildren.forEach((node) => collectFilePaths(node, filePaths));
    return filePaths;
  }, [rootChildren]);
  const allTreeFilePaths = useMemo(() => {
    const filePaths = [];
    (treeRoot?.children || []).forEach((node) => collectFilePaths(node, filePaths));
    return new Set(filePaths);
  }, [treeRoot]);
  const folderPaths = useMemo(() => {
    const nextFolderPaths = new Set();
    rootChildren.forEach((node) => collectFolderPaths(node, nextFolderPaths));
    return nextFolderPaths;
  }, [rootChildren]);

  useEffect(() => {
    if (!(expandedPaths instanceof Set)) return;
    try {
      window.localStorage.setItem(
        kExpandedFoldersStorageKey,
        JSON.stringify(Array.from(expandedPaths)),
      );
    } catch {}
  }, [expandedPaths]);

  useEffect(() => {
    if (!selectedPath) return;
    const ancestorFolderPaths = collectAncestorFolderPaths(selectedPath);
    const selectedIsFolder = folderPaths.has(selectedPath);
    const pathsToExpand = selectedIsFolder
      ? [...ancestorFolderPaths, selectedPath]
      : ancestorFolderPaths;
    if (!pathsToExpand.length) return;
    setExpandedPaths((previousPaths) => {
      if (!(previousPaths instanceof Set)) return previousPaths;
      let didChange = false;
      const nextPaths = new Set(previousPaths);
      pathsToExpand.forEach((ancestorPath) => {
        if (!nextPaths.has(ancestorPath)) {
          nextPaths.add(ancestorPath);
          didChange = true;
        }
      });
      return didChange ? nextPaths : previousPaths;
    });
  }, [selectedPath, folderPaths]);

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
    window.addEventListener(
      kDraftIndexChangedEventName,
      handleDraftIndexChanged,
    );
    window.addEventListener("storage", handleDraftIndexChanged);
    return () => {
      window.removeEventListener(
        kDraftIndexChangedEventName,
        handleDraftIndexChanged,
      );
      window.removeEventListener("storage", handleDraftIndexChanged);
    };
  }, []);

  useEffect(() => {
    if (!isActive) return () => {};
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
  }, [isActive]);

  useEffect(() => {
    if (!isSearchActive) {
      setSearchActivePath("");
      onPreviewFile("");
      return;
    }
    if (searchActivePath && filteredFilePaths.includes(searchActivePath))
      return;
    setSearchActivePath("");
    onPreviewFile("");
  }, [isSearchActive, filteredFilePaths, searchActivePath, onPreviewFile]);

  const setFolderExpanded = (folderPath, nextExpanded) => {
    setExpandedPaths((previousPaths) => {
      const nextPaths =
        previousPaths instanceof Set ? new Set(previousPaths) : new Set();
      if (nextExpanded === true) {
        nextPaths.add(folderPath);
        return nextPaths;
      }
      if (nextExpanded === false) {
        nextPaths.delete(folderPath);
        return nextPaths;
      }
      if (nextPaths.has(folderPath)) nextPaths.delete(folderPath);
      else nextPaths.add(folderPath);
      return nextPaths;
    });
  };

  const selectFolder = (folderPath) => {
    onSelectFile(folderPath, {
      directory: true,
      preservePreview: true,
    });
  };

  const requestDelete = (targetPath) => {
    const normalizedTargetPath = normalizeBrowsePolicyPath(targetPath);
    if (!normalizedTargetPath) return;
    if (!allTreeFilePaths.has(targetPath)) {
      showToast("Only files can be deleted", "warning");
      return;
    }
    if (
      matchesBrowsePolicyPath(kLockedBrowsePaths, normalizedTargetPath) ||
      matchesBrowsePolicyPath(kProtectedBrowsePaths, normalizedTargetPath)
    ) {
      showToast("Protected or locked files cannot be deleted", "warning");
      return;
    }
    setDeleteTargetPath(targetPath);
  };

  const confirmDelete = async () => {
    if (!deleteTargetPath || deletingFile) return;
    setDeletingFile(true);
    try {
      await deleteBrowseFile(deleteTargetPath);
      window.dispatchEvent(
        new CustomEvent("alphaclaw:browse-file-saved", {
          detail: { path: deleteTargetPath },
        }),
      );
      window.dispatchEvent(
        new CustomEvent("alphaclaw:browse-file-deleted", {
          detail: { path: deleteTargetPath },
        }),
      );
      setTreeRoot((previousRoot) =>
        removeTreePath(previousRoot, deleteTargetPath),
      );
      window.dispatchEvent(new CustomEvent("alphaclaw:browse-tree-refresh"));
      onSelectFile("");
      showToast("File deleted", "success");
      setDeleteTargetPath("");
    } catch (deleteError) {
      const message = deleteError.message || "Could not delete file";
      if (/path is not a file/i.test(message)) {
        showToast("Only files can be deleted", "warning");
      } else {
        showToast(message, "error");
      }
    } finally {
      setDeletingFile(false);
    }
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
    const baseIndex =
      currentIndex === -1 ? (direction === "up" ? 0 : -1) : currentIndex;
    const nextIndex =
      (baseIndex + delta + filteredFilePaths.length) % filteredFilePaths.length;
    const nextPath = filteredFilePaths[nextIndex];
    setSearchActivePath(nextPath);
    onPreviewFile(nextPath);
  };

  const commitSearchSelection = () => {
    const [singlePath = ""] = filteredFilePaths;
    const targetPath =
      searchActivePath || (filteredFilePaths.length === 1 ? singlePath : "");
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
              expandedPaths=${safeExpandedPaths}
              onSetFolderExpanded=${setFolderExpanded}
              onSelectFolder=${selectFolder}
              onRequestDelete=${requestDelete}
              onSelectFile=${onSelectFile}
              selectedPath=${selectedPath}
              draftPaths=${draftPaths}
              isSearchActive=${isSearchActive}
              searchActivePath=${searchActivePath}
            />
          `,
        )}
      </ul>
      <${ConfirmDialog}
        visible=${!!deleteTargetPath}
        title="Delete file?"
        message=${`Delete ${deleteTargetPath || "this file"}? This can be restored from diff view before sync.`}
        confirmLabel="Delete"
        confirmLoadingLabel="Deleting..."
        cancelLabel="Cancel"
        confirmTone="warning"
        confirmLoading=${deletingFile}
        confirmDisabled=${deletingFile}
        onCancel=${() => {
          if (deletingFile) return;
          setDeleteTargetPath("");
        }}
        onConfirm=${confirmDelete}
      />
    </div>
  `;
};
