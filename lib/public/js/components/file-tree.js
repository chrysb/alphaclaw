import { h } from "https://esm.sh/preact";
import { useEffect, useMemo, useState } from "https://esm.sh/preact/hooks";
import htm from "https://esm.sh/htm";
import { fetchBrowseTree } from "../lib/api.js";
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
} from "./icons.js";

const html = htm.bind(h);
const kTreeIndentPx = 9;
const kFolderBasePaddingPx = 10;
const kFileBasePaddingPx = 14;
const kCollapsedFoldersStorageKey = "alphaclawBrowseCollapsedFolders";

const readStoredCollapsedPaths = () => {
  try {
    const rawValue = window.localStorage.getItem(kCollapsedFoldersStorageKey);
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
  if (/\.(db|sqlite|sqlite3|db3|sdb|sqlitedb|duckdb|mdb|accdb)$/i.test(normalizedName)) {
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
}) => {
  if (!node) return null;
  if (node.type === "file") {
    const isActive = selectedPath === node.path;
    const fileIconMeta = getFileIconMeta(node.name);
    const FileTypeIcon = fileIconMeta.icon;
    return html`
      <li class="tree-item">
        <a
          class=${isActive ? "active" : ""}
          onclick=${() => onSelectFile(node.path)}
          style=${{
            paddingLeft: `${kFileBasePaddingPx + depth * kTreeIndentPx}px`,
          }}
          title=${node.path || node.name}
        >
          <${FileTypeIcon} className=${fileIconMeta.className} />
          <span class="tree-label">${node.name}</span>
        </a>
      </li>
    `;
  }

  const folderPath = node.path || "";
  const isCollapsed = collapsedPaths.has(folderPath);
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
            />
          `,
        )}
      </ul>
    </li>
  `;
};

export const FileTree = ({ onSelectFile = () => {}, selectedPath = "" }) => {
  const [treeRoot, setTreeRoot] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [collapsedPaths, setCollapsedPaths] = useState(
    readStoredCollapsedPaths,
  );

  useEffect(() => {
    let active = true;
    const loadTree = async () => {
      setLoading(true);
      setError("");
      try {
        const data = await fetchBrowseTree();
        if (!active) return;
        setTreeRoot(data.root || null);
        setCollapsedPaths((previousPaths) => {
          if (previousPaths instanceof Set) return previousPaths;
          const nextPaths = new Set();
          collectFolderPaths(data.root, nextPaths);
          return nextPaths;
        });
      } catch (loadError) {
        if (!active) return;
        setError(loadError.message || "Could not load file tree");
      } finally {
        if (active) setLoading(false);
      }
    };
    loadTree();
    return () => {
      active = false;
    };
  }, []);

  const rootChildren = useMemo(() => treeRoot?.children || [], [treeRoot]);
  const safeCollapsedPaths =
    collapsedPaths instanceof Set ? collapsedPaths : new Set();

  useEffect(() => {
    if (!(collapsedPaths instanceof Set)) return;
    try {
      window.localStorage.setItem(
        kCollapsedFoldersStorageKey,
        JSON.stringify(Array.from(collapsedPaths)),
      );
    } catch {}
  }, [collapsedPaths]);

  const toggleFolder = (folderPath) => {
    setCollapsedPaths((previousPaths) => {
      const nextPaths =
        previousPaths instanceof Set ? new Set(previousPaths) : new Set();
      if (nextPaths.has(folderPath)) nextPaths.delete(folderPath);
      else nextPaths.add(folderPath);
      return nextPaths;
    });
  };

  if (loading) {
    return html`<div class="file-tree-state">Loading files...</div>`;
  }
  if (error) {
    return html`<div class="file-tree-state file-tree-state-error">
      ${error}
    </div>`;
  }
  if (!rootChildren.length) {
    return html`<div class="file-tree-state">No files found.</div>`;
  }

  return html`
    <div class="file-tree-wrap">
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
            />
          `,
        )}
      </ul>
    </div>
  `;
};
