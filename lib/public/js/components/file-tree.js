import { h } from "preact";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "preact/hooks";
import htm from "htm";
import {
  fetchBrowseTree,
  deleteBrowseFile,
  createBrowseFile,
  createBrowseFolder,
  moveBrowsePath,
  downloadBrowseFile,
} from "../lib/api.js";
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
  FileAddLineIcon,
  FolderAddLineIcon,
  DeleteBinLineIcon,
  DownloadLineIcon,
  FileCopyLineIcon,
} from "./icons.js";
import { LoadingSpinner } from "./loading-spinner.js";
import { ConfirmDialog } from "./confirm-dialog.js";
import { showToast } from "./toast.js";
import { copyTextToClipboard } from "../lib/clipboard.js";

const html = htm.bind(h);
const kTreeIndentPx = 9;
const kFolderBasePaddingPx = 10;
const kFileBasePaddingPx = 14;
const kTreeRefreshIntervalMs = 5000;
import { kExpandedFoldersStorageKey } from "../lib/storage-keys.js";

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

const collectTruncatedExpandedFolderPaths = (node, expandedPaths, folderPaths) => {
  if (!node || node.type !== "folder") return;
  if (node.truncated && expandedPaths.has(node.path || "")) {
    folderPaths.push(node.path || "");
  }
  (node.children || []).forEach((childNode) =>
    collectTruncatedExpandedFolderPaths(childNode, expandedPaths, folderPaths),
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

const replaceTreeNode = (node, nextNode) => {
  if (!node || !nextNode) return node;
  if (String(node.path || "") === String(nextNode.path || "")) return nextNode;
  if (node.type !== "folder") return node;
  const nextChildren = (node.children || []).map((childNode) =>
    replaceTreeNode(childNode, nextNode),
  );
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

const TreeContextMenu = ({
  x,
  y,
  targetPath,
  targetType,
  isLocked,
  onNewFile,
  onNewFolder,
  onCopyPath,
  onDownload,
  onDelete,
  onClose,
}) => {
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClick = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) onClose();
    };
    const handleKey = (e) => {
      if (e.key === "Escape") onClose();
    };
    const handleScroll = () => onClose();
    window.addEventListener("mousedown", handleClick);
    window.addEventListener("keydown", handleKey);
    window.addEventListener("scroll", handleScroll, true);
    return () => {
      window.removeEventListener("mousedown", handleClick);
      window.removeEventListener("keydown", handleKey);
      window.removeEventListener("scroll", handleScroll, true);
    };
  }, [onClose]);

  const isFolder = targetType === "folder";
  const isFile = targetType === "file";
  const isRoot = targetType === "root";
  const contextFolder = isFolder ? targetPath : "";
  const canCreate = !isLocked && (isFolder || isRoot);
  const canCopyPath = Boolean((isFolder || isFile) && targetPath);
  const canDownload = isFile && targetPath;
  const canDelete = !isLocked && (isFolder || isFile) && targetPath;

  return html`
    <div
      ref=${menuRef}
      class="tree-context-menu"
      style=${{ top: `${y}px`, left: `${x}px` }}
    >
      ${canCreate
        ? html`
            <button
              class="tree-context-menu-item"
              onclick=${() => { onNewFile(contextFolder); onClose(); }}
            >
              <${FileAddLineIcon} className="tree-context-menu-icon" />
              <span>New File</span>
            </button>
            <button
              class="tree-context-menu-item"
              onclick=${() => { onNewFolder(contextFolder); onClose(); }}
            >
              <${FolderAddLineIcon} className="tree-context-menu-icon" />
              <span>New Folder</span>
            </button>
          `
        : null}
      ${canCopyPath || canDownload || canDelete
        ? html`
            ${canCreate
              ? html`<div class="tree-context-menu-sep"></div>`
              : null}
            ${canCopyPath
              ? html`
                  <button
                    class="tree-context-menu-item"
                    onclick=${() => { onCopyPath(targetPath); onClose(); }}
                  >
                    <${FileCopyLineIcon} className="tree-context-menu-icon" />
                    <span>Copy Path</span>
                  </button>
                `
              : null}
            ${canDownload
              ? html`
                  <button
                    class="tree-context-menu-item"
                    onclick=${() => { onDownload(targetPath); onClose(); }}
                  >
                    <${DownloadLineIcon} className="tree-context-menu-icon" />
                    <span>Download</span>
                  </button>
                `
              : null}
            ${canDelete
              ? html`
                  <button
                    class="tree-context-menu-item"
                    onclick=${() => { onDelete(targetPath); onClose(); }}
                  >
                    <${DeleteBinLineIcon} className="tree-context-menu-icon" />
                    <span>Delete</span>
                  </button>
                `
              : null}
          `
        : null}
      ${isLocked
        ? html`
            <div class="tree-context-menu-item is-disabled">
              <${LockLineIcon} className="tree-context-menu-icon" />
              <span>Managed by AlphaClaw</span>
            </div>
          `
        : null}
    </div>
  `;
};

const CreationInput = ({ type, depth, onConfirm, onCancel }) => {
  const inputRef = useRef(null);
  const [value, setValue] = useState("");
  const submittedRef = useRef(false);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const submit = () => {
    const name = value.trim();
    if (!name || submittedRef.current) {
      onCancel();
      return;
    }
    submittedRef.current = true;
    onConfirm(name);
  };

  const IconComponent = type === "folder" ? FolderAddLineIcon : FileAddLineIcon;
  return html`
    <li class="tree-item">
      <div
        class="tree-create-row"
        style=${{ paddingLeft: `${kFileBasePaddingPx + depth * kTreeIndentPx}px` }}
      >
        <${IconComponent} className="tree-create-icon" />
        <input
          ref=${inputRef}
          class="tree-create-input"
          type="text"
          value=${value}
          onInput=${(e) => setValue(e.target.value)}
          onKeyDown=${(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              submit();
            }
            if (e.key === "Escape") {
              e.preventDefault();
              onCancel();
            }
          }}
          onBlur=${submit}
          placeholder=${type === "folder" ? "folder name" : "file name"}
          autocomplete="off"
          spellcheck=${false}
        />
      </div>
    </li>
  `;
};

const TreeNode = ({
  node,
  depth = 0,
  expandedPaths,
  onSetFolderExpanded,
  onSelectFolder,
  onRequestDelete,
  onSelectFile,
  onContextMenu,
  onDragDrop,
  selectedPath = "",
  draftPaths,
  isSearchActive = false,
  searchActivePath = "",
  creatingInFolder = "",
  creatingType = "",
  onCreationConfirm,
  onCreationCancel,
  dragSourcePath = "",
  loadingFolderPaths = new Set(),
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
      <li class="tree-item${dragSourcePath === node.path ? " is-dragging" : ""}">
        <a
          class=${`${isActive ? "active" : ""} ${isSearchActiveNode && !isActive ? "soft-active" : ""}`.trim()}
          onclick=${() => onSelectFile(node.path)}
          oncontextmenu=${(e) => {
            e.preventDefault();
            e.stopPropagation();
            onContextMenu({ x: e.clientX, y: e.clientY, targetPath: node.path, targetType: "file", isLocked });
          }}
          draggable=${!isLocked}
          onDragStart=${(e) => {
            if (isLocked) { e.preventDefault(); return; }
            e.dataTransfer.setData("text/plain", node.path);
            e.dataTransfer.effectAllowed = "move";
            onDragDrop("start", node.path);
          }}
          onDragEnd=${() => onDragDrop("end", "")}
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
  const isLoadingFolder = loadingFolderPaths.has(folderPath);
  const isFolderActive = selectedPath === folderPath;
  const isFolderLocked = folderPath && matchesBrowsePolicyPath(
    kLockedBrowsePaths,
    normalizeBrowsePolicyPath(folderPath),
  );
  const [isDropTarget, setIsDropTarget] = useState(false);
  const dropCounterRef = useRef(0);
  return html`
    <li class="tree-item${dragSourcePath === folderPath ? " is-dragging" : ""}">
      <div
        class=${`tree-folder ${isCollapsed ? "collapsed" : ""} ${isFolderActive ? "active" : ""} ${isDropTarget ? "is-drop-target" : ""}`.trim()}
        onclick=${() => {
          if (!folderPath) return;
          onSetFolderExpanded(folderPath, isCollapsed, node);
          onSelectFolder(folderPath);
        }}
        oncontextmenu=${(e) => {
          e.preventDefault();
          e.stopPropagation();
          onContextMenu({ x: e.clientX, y: e.clientY, targetPath: folderPath, targetType: "folder", isLocked: isFolderLocked });
        }}
        draggable=${!!folderPath && !isFolderLocked}
        onDragStart=${(e) => {
          if (!folderPath || isFolderLocked) { e.preventDefault(); return; }
          e.dataTransfer.setData("text/plain", folderPath);
          e.dataTransfer.effectAllowed = "move";
          onDragDrop("start", folderPath);
        }}
        onDragEnd=${() => { setIsDropTarget(false); dropCounterRef.current = 0; onDragDrop("end", ""); }}
        onDragOver=${(e) => {
          if (isFolderLocked) return;
          e.preventDefault();
          e.dataTransfer.dropEffect = "move";
        }}
        onDragEnter=${(e) => {
          if (isFolderLocked) return;
          e.preventDefault();
          dropCounterRef.current += 1;
          if (dropCounterRef.current === 1) setIsDropTarget(true);
        }}
        onDragLeave=${() => {
          dropCounterRef.current -= 1;
          if (dropCounterRef.current <= 0) { dropCounterRef.current = 0; setIsDropTarget(false); }
        }}
        onDrop=${(e) => {
          if (isFolderLocked) return;
          e.preventDefault();
          e.stopPropagation();
          setIsDropTarget(false);
          dropCounterRef.current = 0;
          const sourcePath = e.dataTransfer.getData("text/plain");
          if (sourcePath && sourcePath !== folderPath) {
            onDragDrop("drop", sourcePath, folderPath);
          }
        }}
        style=${{
          paddingLeft: `${kFolderBasePaddingPx + depth * kTreeIndentPx}px`,
        }}
        title=${folderPath || node.name}
      >
        <button
          type="button"
          class="tree-folder-toggle"
          aria-label=${`${isCollapsed ? "Expand" : "Collapse"} ${node.name || "folder"}`}
          aria-expanded=${isCollapsed ? "false" : "true"}
          onclick=${(event) => {
            event.preventDefault();
            event.stopPropagation();
            if (!folderPath) return;
            onSetFolderExpanded(folderPath, isCollapsed, node);
          }}
          disabled=${isLoadingFolder}
        >
          <span class="arrow">▼</span>
        </button>
        <span class="tree-label">${node.name}</span>
        ${isFolderLocked
          ? html`<${LockLineIcon}
              className="tree-lock-icon"
              title="Managed by AlphaClaw"
            />`
          : null}
      </div>
      <ul class=${`tree-children ${isCollapsed ? "hidden" : ""}`}>
        ${creatingInFolder === folderPath && creatingType === "folder"
          ? html`
              <${CreationInput}
                key="__creation__"
                type="folder"
                depth=${depth + 1}
                onConfirm=${onCreationConfirm}
                onCancel=${onCreationCancel}
              />
            `
          : null}
        ${(node.children || []).filter((c) => c.type === "folder").map(
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
              onContextMenu=${onContextMenu}
              onDragDrop=${onDragDrop}
              selectedPath=${selectedPath}
              draftPaths=${draftPaths}
              isSearchActive=${isSearchActive}
              searchActivePath=${searchActivePath}
              creatingInFolder=${creatingInFolder}
              creatingType=${creatingType}
              onCreationConfirm=${onCreationConfirm}
              onCreationCancel=${onCreationCancel}
              dragSourcePath=${dragSourcePath}
              loadingFolderPaths=${loadingFolderPaths}
            />
          `,
        )}
        ${creatingInFolder === folderPath && creatingType === "file"
          ? html`
              <${CreationInput}
                key="__creation__"
                type="file"
                depth=${depth + 1}
                onConfirm=${onCreationConfirm}
                onCancel=${onCreationCancel}
              />
            `
          : null}
        ${(node.children || []).filter((c) => c.type !== "folder").map(
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
              onContextMenu=${onContextMenu}
              onDragDrop=${onDragDrop}
              selectedPath=${selectedPath}
              draftPaths=${draftPaths}
              isSearchActive=${isSearchActive}
              searchActivePath=${searchActivePath}
              creatingInFolder=${creatingInFolder}
              creatingType=${creatingType}
              onCreationConfirm=${onCreationConfirm}
              onCreationCancel=${onCreationCancel}
              dragSourcePath=${dragSourcePath}
              loadingFolderPaths=${loadingFolderPaths}
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
  const [creatingInFolder, setCreatingInFolder] = useState("");
  const [creatingType, setCreatingType] = useState("");
  const [contextMenu, setContextMenu] = useState(null);
  const [dragSourcePath, setDragSourcePath] = useState("");
  const [loadingFolderPaths, setLoadingFolderPaths] = useState(new Set());
  const [selectedFolder, setSelectedFolder] = useState("");
  const effectiveSelectedPath = selectedFolder || selectedPath;
  const searchInputRef = useRef(null);
  const treeSignatureRef = useRef("");

  const loadTree = useCallback(async ({ showLoading = false } = {}) => {
    if (showLoading) setLoading(true);
    if (showLoading) setError("");
    try {
      const data = await fetchBrowseTree();
      const nextRoot = data.root || null;
      const nextExpandedPaths =
        expandedPaths instanceof Set ? expandedPaths : new Set();
      let hydratedRoot = nextRoot;
      const hydratedPaths = new Set();
      while (true) {
        const truncatedExpandedPaths = [];
        collectTruncatedExpandedFolderPaths(
          hydratedRoot,
          nextExpandedPaths,
          truncatedExpandedPaths,
        );
        const nextFolderPath = truncatedExpandedPaths.find(
          (folderPath) => !hydratedPaths.has(folderPath),
        );
        if (!nextFolderPath) break;
        hydratedPaths.add(nextFolderPath);
        const subtreeData = await fetchBrowseTree({ path: nextFolderPath });
        if (subtreeData.root) {
          hydratedRoot = replaceTreeNode(hydratedRoot, subtreeData.root);
        }
      }
      const nextSignature = JSON.stringify(hydratedRoot || {});
      if (treeSignatureRef.current !== nextSignature) {
        treeSignatureRef.current = nextSignature;
        setTreeRoot(hydratedRoot);
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
  }, [expandedPaths]);

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
    if (selectedPath) setSelectedFolder("");
  }, [selectedPath]);

  useEffect(() => {
    if (!selectedPath) return;
    const ancestorFolderPaths = collectAncestorFolderPaths(selectedPath);
    if (!ancestorFolderPaths.length) return;
    setExpandedPaths((previousPaths) => {
      if (!(previousPaths instanceof Set)) return previousPaths;
      let didChange = false;
      const nextPaths = new Set(previousPaths);
      ancestorFolderPaths.forEach((ancestorPath) => {
        if (!nextPaths.has(ancestorPath)) {
          nextPaths.add(ancestorPath);
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

  const setFolderExpanded = async (folderPath, nextExpanded, node = null) => {
    if (nextExpanded === true && node?.truncated) {
      setLoadingFolderPaths((previousPaths) => {
        const nextPaths =
          previousPaths instanceof Set ? new Set(previousPaths) : new Set();
        nextPaths.add(folderPath);
        return nextPaths;
      });
      try {
        const data = await fetchBrowseTree({ path: folderPath });
        if (data.root) {
          setTreeRoot((previousRoot) => replaceTreeNode(previousRoot, data.root));
        }
      } catch (loadError) {
        showToast(loadError.message || "Could not load folder", "error");
        return;
      } finally {
        setLoadingFolderPaths((previousPaths) => {
          const nextPaths =
            previousPaths instanceof Set ? new Set(previousPaths) : new Set();
          nextPaths.delete(folderPath);
          return nextPaths;
        });
      }
    }
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

  const handleSelectFile = useCallback((filePath, options) => {
    setSelectedFolder("");
    onSelectFile(filePath, options);
  }, [onSelectFile]);

  const selectFolder = (folderPath) => {
    setSelectedFolder(folderPath);
  };

  const requestDelete = (targetPath) => {
    const normalizedTargetPath = normalizeBrowsePolicyPath(targetPath);
    if (!normalizedTargetPath) return;
    if (
      matchesBrowsePolicyPath(kLockedBrowsePaths, normalizedTargetPath) ||
      matchesBrowsePolicyPath(kProtectedBrowsePaths, normalizedTargetPath)
    ) {
      showToast("Protected or locked paths cannot be deleted", "warning");
      return;
    }
    setDeleteTargetPath(targetPath);
  };

  const deleteTargetIsFolder = folderPaths.has(deleteTargetPath);

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
      handleSelectFile("");
      showToast(deleteTargetIsFolder ? "Folder deleted" : "File deleted", "success");
      setDeleteTargetPath("");
    } catch (deleteError) {
      showToast(deleteError.message || "Could not delete", "error");
    } finally {
      setDeletingFile(false);
    }
  };

  const getCreateFolder = (explicitFolder) => {
    if (explicitFolder !== undefined) return explicitFolder;
    if (!effectiveSelectedPath) return "";
    if (folderPaths.has(effectiveSelectedPath)) return effectiveSelectedPath;
    const lastSlash = effectiveSelectedPath.lastIndexOf("/");
    return lastSlash > 0 ? effectiveSelectedPath.slice(0, lastSlash) : "";
  };

  const requestCreate = (folderPath, type) => {
    const target = getCreateFolder(folderPath);
    if (target && matchesBrowsePolicyPath(kLockedBrowsePaths, normalizeBrowsePolicyPath(target))) {
      showToast("Cannot create inside a locked folder", "warning");
      return;
    }
    setCreatingInFolder(target);
    setCreatingType(type);
    if (target) {
      setExpandedPaths((prev) => {
        const next = prev instanceof Set ? new Set(prev) : new Set();
        next.add(target);
        return next;
      });
    }
  };

  const requestCreateFromToolbar = (type) => {
    requestCreate(getCreateFolder(), type);
  };

  const cancelCreate = () => {
    setCreatingInFolder("");
    setCreatingType("");
  };

  const confirmCreate = async (name) => {
    const folder = creatingInFolder;
    const type = creatingType;
    cancelCreate();
    const fullPath = folder ? `${folder}/${name}` : name;
    try {
      if (type === "folder") {
        await createBrowseFolder(fullPath);
        showToast("Folder created", "success");
      } else {
        await createBrowseFile(fullPath);
        showToast("File created", "success");
      }
      window.dispatchEvent(new CustomEvent("alphaclaw:browse-tree-refresh"));
      if (folder) {
        setExpandedPaths((prev) => {
          const next = prev instanceof Set ? new Set(prev) : new Set();
          next.add(folder);
          return next;
        });
      }
      if (type === "file") {
        handleSelectFile(fullPath);
      }
    } catch (createError) {
      showToast(createError.message || `Could not create ${type}`, "error");
    }
  };

  const openContextMenu = (menu) => {
    setContextMenu(menu);
  };

  const closeContextMenu = () => {
    setContextMenu(null);
  };

  const requestDownload = async (targetPath) => {
    try {
      await downloadBrowseFile(targetPath);
      showToast("Download started", "success");
    } catch (downloadError) {
      showToast(downloadError.message || "Could not download file", "error");
    }
  };

  const copyPath = async (targetPath) => {
    const copied = await copyTextToClipboard(targetPath);
    if (copied) {
      showToast("Path copied", "success");
      return;
    }
    showToast("Could not copy path", "error");
  };

  const handleDragDrop = async (action, sourcePath, targetFolder) => {
    if (action === "start") {
      setDragSourcePath(sourcePath);
      return;
    }
    if (action === "end") {
      setDragSourcePath("");
      return;
    }
    if (action === "drop") {
      setDragSourcePath("");
      const basename = sourcePath.split("/").pop();
      if (!basename) return;
      const destination = targetFolder ? `${targetFolder}/${basename}` : basename;
      if (sourcePath === destination) return;
      try {
        await moveBrowsePath(sourcePath, destination);
        showToast(`Moved to ${targetFolder || "root"}`, "success");
        window.dispatchEvent(new CustomEvent("alphaclaw:browse-tree-refresh"));
        if (selectedPath === sourcePath) {
          handleSelectFile(destination);
        }
      } catch (moveError) {
        showToast(moveError.message || "Could not move", "error");
      }
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
    handleSelectFile(targetPath);
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
          <${LoadingSpinner} className="h-5 w-5 text-fg-muted" />
        </div>
      </div>
    `;
  }
  if (error) {
    return html`<div class="file-tree-state file-tree-state-error">
      ${error}
    </div>`;
  }
  if (!rootChildren.length && !creatingType) {
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
          <span class="file-tree-search-actions">
            <button
              type="button"
              class="tree-folder-action"
              title="New file"
              onclick=${() => requestCreateFromToolbar("file")}
            >
              <${FileAddLineIcon} className="tree-folder-action-icon" />
            </button>
            <button
              type="button"
              class="tree-folder-action"
              title="New folder"
              onclick=${() => requestCreateFromToolbar("folder")}
            >
              <${FolderAddLineIcon} className="tree-folder-action-icon" />
            </button>
          </span>
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
        <span class="file-tree-search-actions">
          <button
            type="button"
            class="tree-folder-action"
            title="New file"
            onclick=${() => requestCreateFromToolbar("file")}
          >
            <${FileAddLineIcon} className="tree-folder-action-icon" />
          </button>
          <button
            type="button"
            class="tree-folder-action"
            title="New folder"
            onclick=${() => requestCreateFromToolbar("folder")}
          >
            <${FolderAddLineIcon} className="tree-folder-action-icon" />
          </button>
        </span>
      </div>
      <div class="file-tree-scroll">
      <ul
        class="file-tree"
        oncontextmenu=${(e) => {
          e.preventDefault();
          openContextMenu({ x: e.clientX, y: e.clientY, targetPath: "", targetType: "root" });
        }}
        onDragOver=${(e) => { e.preventDefault(); e.dataTransfer.dropEffect = "move"; }}
        onDrop=${(e) => {
          e.preventDefault();
          const sourcePath = e.dataTransfer.getData("text/plain");
          if (sourcePath) handleDragDrop("drop", sourcePath, "");
        }}
      >
        ${creatingInFolder === "" && creatingType === "folder"
          ? html`
              <${CreationInput}
                key="__root-creation__"
                type="folder"
                depth=${0}
                onConfirm=${confirmCreate}
                onCancel=${cancelCreate}
              />
            `
          : null}
        ${rootChildren.filter((n) => n.type === "folder").map(
          (node) => html`
            <${TreeNode}
              key=${node.path || node.name}
              node=${node}
              expandedPaths=${safeExpandedPaths}
              onSetFolderExpanded=${setFolderExpanded}
              onSelectFolder=${selectFolder}
              onRequestDelete=${requestDelete}
              onSelectFile=${handleSelectFile}
              onContextMenu=${openContextMenu}
              onDragDrop=${handleDragDrop}
              selectedPath=${effectiveSelectedPath}
              draftPaths=${draftPaths}
              isSearchActive=${isSearchActive}
              searchActivePath=${searchActivePath}
              creatingInFolder=${creatingInFolder}
              creatingType=${creatingType}
              onCreationConfirm=${confirmCreate}
              onCreationCancel=${cancelCreate}
              dragSourcePath=${dragSourcePath}
              loadingFolderPaths=${loadingFolderPaths}
            />
          `,
        )}
        ${creatingInFolder === "" && creatingType === "file"
          ? html`
              <${CreationInput}
                key="__root-creation__"
                type="file"
                depth=${0}
                onConfirm=${confirmCreate}
                onCancel=${cancelCreate}
              />
            `
          : null}
        ${rootChildren.filter((n) => n.type !== "folder").map(
          (node) => html`
            <${TreeNode}
              key=${node.path || node.name}
              node=${node}
              expandedPaths=${safeExpandedPaths}
              onSetFolderExpanded=${setFolderExpanded}
              onSelectFolder=${selectFolder}
              onRequestDelete=${requestDelete}
              onSelectFile=${handleSelectFile}
              onContextMenu=${openContextMenu}
              onDragDrop=${handleDragDrop}
              selectedPath=${effectiveSelectedPath}
              draftPaths=${draftPaths}
              isSearchActive=${isSearchActive}
              searchActivePath=${searchActivePath}
              creatingInFolder=${creatingInFolder}
              creatingType=${creatingType}
              onCreationConfirm=${confirmCreate}
              onCreationCancel=${cancelCreate}
              dragSourcePath=${dragSourcePath}
              loadingFolderPaths=${loadingFolderPaths}
            />
          `,
        )}
      </ul>
      </div>
      ${contextMenu
        ? html`
            <${TreeContextMenu}
              x=${contextMenu.x}
              y=${contextMenu.y}
              targetPath=${contextMenu.targetPath}
              targetType=${contextMenu.targetType}
              isLocked=${!!contextMenu.isLocked}
              onNewFile=${(folder) => requestCreate(folder, "file")}
              onNewFolder=${(folder) => requestCreate(folder, "folder")}
              onCopyPath=${copyPath}
              onDownload=${requestDownload}
              onDelete=${requestDelete}
              onClose=${closeContextMenu}
            />
          `
        : null}
      <${ConfirmDialog}
        visible=${!!deleteTargetPath}
        title=${deleteTargetIsFolder ? "Delete folder?" : "Delete file?"}
        message=${deleteTargetIsFolder
          ? `Delete folder ${deleteTargetPath || "this folder"} and all its contents?`
          : `Delete ${deleteTargetPath || "this file"}? This can be restored from diff view before sync.`}
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
