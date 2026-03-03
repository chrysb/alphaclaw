import { h } from "https://esm.sh/preact";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "https://esm.sh/preact/hooks";
import htm from "https://esm.sh/htm";
import { marked } from "https://esm.sh/marked";
import {
  fetchBrowseFileDiff,
  fetchFileContent,
  saveFileContent,
} from "../lib/api.js";
import {
  formatFrontmatterValue,
  getFileSyntaxKind,
  highlightEditorLines,
  parseFrontmatter,
} from "../lib/syntax-highlighters/index.js";
import {
  clearStoredFileDraft,
  readStoredFileDraft,
  updateDraftIndex,
  writeStoredFileDraft,
} from "../lib/browse-draft-state.js";
import { ActionButton } from "./action-button.js";
import { LoadingSpinner } from "./loading-spinner.js";
import { SegmentedControl } from "./segmented-control.js";
import { LockLineIcon, SaveFillIcon } from "./icons.js";
import { showToast } from "./toast.js";

const html = htm.bind(h);
const kFileViewerModeStorageKey = "alphaclaw.browse.fileViewerMode";
const kLegacyFileViewerModeStorageKey = "alphaclawBrowseFileViewerMode";
const kEditorSelectionStorageKey = "alphaclaw.browse.editorSelectionByPath";
const kProtectedBrowsePaths = new Set(["openclaw.json", "devices/paired.json"]);
const kLockedBrowsePaths = new Set([
  "hooks/bootstrap/agents.md",
  "hooks/bootstrap/tools.md",
  ".alphaclaw/hourly-git-sync.sh",
  ".alphaclaw/.cli-device-auto-approved",
]);
const kLoadingIndicatorDelayMs = 1000;
const kFileRefreshIntervalMs = 5000;

const parsePathSegments = (inputPath) =>
  String(inputPath || "")
    .split("/")
    .map((part) => part.trim())
    .filter(Boolean);

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

const readStoredFileViewerMode = () => {
  try {
    const storedMode = String(
      window.localStorage.getItem(kFileViewerModeStorageKey) ||
        window.localStorage.getItem(kLegacyFileViewerModeStorageKey) ||
        "",
    ).trim();
    return storedMode === "preview" ? "preview" : "edit";
  } catch {
    return "edit";
  }
};

const clampSelectionIndex = (value, maxValue) => {
  const numericValue = Number.parseInt(String(value ?? ""), 10);
  if (!Number.isFinite(numericValue)) return 0;
  return Math.max(0, Math.min(maxValue, numericValue));
};

const readEditorSelectionStorageMap = () => {
  try {
    const rawStorageValue = window.localStorage.getItem(
      kEditorSelectionStorageKey,
    );
    if (!rawStorageValue) return {};
    const parsedStorageValue = JSON.parse(rawStorageValue);
    if (!parsedStorageValue || typeof parsedStorageValue !== "object")
      return {};
    return parsedStorageValue;
  } catch {
    return {};
  }
};

const readStoredEditorSelection = (filePath) => {
  const safePath = String(filePath || "").trim();
  if (!safePath) return null;
  const storageMap = readEditorSelectionStorageMap();
  const selection = storageMap[safePath];
  if (!selection || typeof selection !== "object") return null;
  return {
    start: selection.start,
    end: selection.end,
  };
};

const writeStoredEditorSelection = (filePath, selection) => {
  const safePath = String(filePath || "").trim();
  if (!safePath || !selection || typeof selection !== "object") return;
  try {
    const nextStorageValue = readEditorSelectionStorageMap();
    nextStorageValue[safePath] = {
      start: selection.start,
      end: selection.end,
    };
    window.localStorage.setItem(
      kEditorSelectionStorageKey,
      JSON.stringify(nextStorageValue),
    );
  } catch {}
};

export const FileViewer = ({
  filePath = "",
  isPreviewOnly = false,
  browseView = "edit",
  onRequestEdit = () => {},
}) => {
  const normalizedPath = String(filePath || "").trim();
  const normalizedPolicyPath = normalizePolicyPath(normalizedPath);
  const [content, setContent] = useState("");
  const [initialContent, setInitialContent] = useState("");
  const [fileKind, setFileKind] = useState("text");
  const [imageDataUrl, setImageDataUrl] = useState("");
  const [audioDataUrl, setAudioDataUrl] = useState("");
  const [viewMode, setViewMode] = useState(readStoredFileViewerMode);
  const [loading, setLoading] = useState(false);
  const [showDelayedLoadingSpinner, setShowDelayedLoadingSpinner] =
    useState(false);
  const [diffLoading, setDiffLoading] = useState(false);
  const [diffError, setDiffError] = useState("");
  const [diffContent, setDiffContent] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [isFolderPath, setIsFolderPath] = useState(false);
  const [frontmatterCollapsed, setFrontmatterCollapsed] = useState(false);
  const [externalChangeNoticeShown, setExternalChangeNoticeShown] =
    useState(false);
  const [protectedEditBypassPaths, setProtectedEditBypassPaths] = useState(
    () => new Set(),
  );
  const editorLineNumbersRef = useRef(null);
  const editorHighlightRef = useRef(null);
  const editorTextareaRef = useRef(null);
  const previewRef = useRef(null);
  const viewScrollRatioRef = useRef(0);
  const isSyncingScrollRef = useRef(false);
  const loadedFilePathRef = useRef("");
  const restoredSelectionPathRef = useRef("");
  const fileRefreshInFlightRef = useRef(false);
  const editorLineNumberRowRefs = useRef([]);
  const editorHighlightLineRefs = useRef([]);

  const pathSegments = useMemo(
    () => parsePathSegments(normalizedPath),
    [normalizedPath],
  );
  const isCurrentFileLoaded = loadedFilePathRef.current === normalizedPath;
  const renderContent = isCurrentFileLoaded ? content : "";
  const renderInitialContent = isCurrentFileLoaded ? initialContent : "";
  const hasSelectedPath = normalizedPath.length > 0;
  const isImageFile = fileKind === "image";
  const isAudioFile = fileKind === "audio";
  const canEditFile =
    hasSelectedPath &&
    !isFolderPath &&
    !isPreviewOnly &&
    !isImageFile &&
    !isAudioFile;
  const isDiffView = String(browseView || "edit") === "diff";
  const isDirty = canEditFile && renderContent !== renderInitialContent;
  const isLockedFile =
    canEditFile && matchesPolicyPath(kLockedBrowsePaths, normalizedPolicyPath);
  const isProtectedFile =
    canEditFile &&
    !isLockedFile &&
    matchesPolicyPath(kProtectedBrowsePaths, normalizedPolicyPath);
  const isProtectedLocked =
    isProtectedFile && !protectedEditBypassPaths.has(normalizedPolicyPath);
  const isEditBlocked = isLockedFile || isProtectedLocked;
  const syntaxKind = useMemo(
    () => getFileSyntaxKind(normalizedPath),
    [normalizedPath],
  );
  const isMarkdownFile = syntaxKind === "markdown";
  const shouldUseHighlightedEditor = syntaxKind !== "plain";
  const parsedFrontmatter = useMemo(
    () =>
      isMarkdownFile
        ? parseFrontmatter(renderContent)
        : { entries: [], body: renderContent },
    [renderContent, isMarkdownFile],
  );
  const highlightedEditorLines = useMemo(
    () =>
      shouldUseHighlightedEditor
        ? highlightEditorLines(renderContent, syntaxKind)
        : [],
    [renderContent, shouldUseHighlightedEditor, syntaxKind],
  );
  const editorLineNumbers = useMemo(() => {
    const lineCount = String(renderContent || "").split("\n").length;
    return Array.from({ length: lineCount }, (_, index) => index + 1);
  }, [renderContent]);

  const syncEditorLineNumberHeights = useCallback(() => {
    if (!shouldUseHighlightedEditor || viewMode !== "edit") return;
    const numberRows = editorLineNumberRowRefs.current;
    const highlightRows = editorHighlightLineRefs.current;
    const rowCount = Math.min(numberRows.length, highlightRows.length);
    for (let index = 0; index < rowCount; index += 1) {
      const numberRow = numberRows[index];
      const highlightRow = highlightRows[index];
      if (!numberRow || !highlightRow) continue;
      numberRow.style.height = `${highlightRow.offsetHeight}px`;
    }
  }, [shouldUseHighlightedEditor, viewMode]);

  useEffect(() => {
    syncEditorLineNumberHeights();
  }, [content, syncEditorLineNumberHeights]);

  useEffect(() => {
    if (!shouldUseHighlightedEditor || viewMode !== "edit") return () => {};
    const onResize = () => syncEditorLineNumberHeights();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [shouldUseHighlightedEditor, viewMode, syncEditorLineNumberHeights]);
  const previewHtml = useMemo(
    () =>
      isMarkdownFile
        ? marked.parse(parsedFrontmatter.body || "", {
            gfm: true,
            breaks: true,
          })
        : "",
    [parsedFrontmatter.body, isMarkdownFile],
  );

  useEffect(() => {
    if (!isMarkdownFile && viewMode !== "edit") {
      setViewMode("edit");
    }
  }, [isMarkdownFile, viewMode]);

  useEffect(() => {
    try {
      window.localStorage.setItem(kFileViewerModeStorageKey, viewMode);
    } catch {}
  }, [viewMode]);

  useEffect(() => {
    if (!loading) {
      setShowDelayedLoadingSpinner(false);
      return () => {};
    }
    const timer = window.setTimeout(() => {
      setShowDelayedLoadingSpinner(true);
    }, kLoadingIndicatorDelayMs);
    return () => window.clearTimeout(timer);
  }, [loading]);

  useEffect(() => {
    let active = true;
    loadedFilePathRef.current = "";
    restoredSelectionPathRef.current = "";
    if (!hasSelectedPath) {
      setContent("");
      setInitialContent("");
      setFileKind("text");
      setImageDataUrl("");
      setAudioDataUrl("");
      setError("");
      setIsFolderPath(false);
      viewScrollRatioRef.current = 0;
      loadedFilePathRef.current = "";
      return () => {
        active = false;
      };
    }
    // Clear previous file state immediately so large content from the last
    // file is never rendered/parses under the next file's syntax mode.
    setContent("");
    setInitialContent("");
    setImageDataUrl("");
    setAudioDataUrl("");
    setFileKind("text");
    setError("");
    setIsFolderPath(false);
    setExternalChangeNoticeShown(false);
    viewScrollRatioRef.current = 0;

    const loadFile = async () => {
      setLoading(true);
      setError("");
      setIsFolderPath(false);
      try {
        const data = await fetchFileContent(normalizedPath);
        if (!active) return;
        const nextFileKind =
          data?.kind === "image"
            ? "image"
            : data?.kind === "audio"
              ? "audio"
              : "text";
        setFileKind(nextFileKind);
        if (nextFileKind === "image") {
          setImageDataUrl(String(data?.imageDataUrl || ""));
          setAudioDataUrl("");
          setContent("");
          setInitialContent("");
          setExternalChangeNoticeShown(false);
          viewScrollRatioRef.current = 0;
          loadedFilePathRef.current = normalizedPath;
          restoredSelectionPathRef.current = "";
          return;
        }
        if (nextFileKind === "audio") {
          setAudioDataUrl(String(data?.audioDataUrl || ""));
          setImageDataUrl("");
          setContent("");
          setInitialContent("");
          setExternalChangeNoticeShown(false);
          viewScrollRatioRef.current = 0;
          loadedFilePathRef.current = normalizedPath;
          restoredSelectionPathRef.current = "";
          return;
        }
        setImageDataUrl("");
        setAudioDataUrl("");
        const nextContent = data.content || "";
        const draftContent = readStoredFileDraft(normalizedPath);
        setContent(draftContent || nextContent);
        updateDraftIndex(
          normalizedPath,
          Boolean(draftContent && draftContent !== nextContent),
          { dispatchEvent: (event) => window.dispatchEvent(event) },
        );
        setInitialContent(nextContent);
        setExternalChangeNoticeShown(false);
        viewScrollRatioRef.current = 0;
        loadedFilePathRef.current = normalizedPath;
        restoredSelectionPathRef.current = "";
      } catch (loadError) {
        if (!active) return;
        setFileKind("text");
        setImageDataUrl("");
        setAudioDataUrl("");
        const message = loadError.message || "Could not load file";
        if (/path is not a file/i.test(message)) {
          setContent("");
          setInitialContent("");
          setIsFolderPath(true);
          setError("");
          loadedFilePathRef.current = normalizedPath;
          restoredSelectionPathRef.current = "";
          return;
        }
        setError(message);
      } finally {
        if (active) setLoading(false);
      }
    };
    loadFile();
    return () => {
      active = false;
    };
  }, [hasSelectedPath, normalizedPath]);

  useEffect(() => {
    if (!hasSelectedPath || isFolderPath || !canEditFile) return () => {};
    const refreshFromDisk = async () => {
      if (loading || saving) return;
      if (fileRefreshInFlightRef.current) return;
      fileRefreshInFlightRef.current = true;
      try {
        const data = await fetchFileContent(normalizedPath);
        const diskContent = data.content || "";
        if (diskContent === initialContent) {
          setExternalChangeNoticeShown(false);
          return;
        }
        // Auto-refresh only when editor has no unsaved work.
        if (!isDirty) {
          setContent(diskContent);
          setInitialContent(diskContent);
          clearStoredFileDraft(normalizedPath);
          updateDraftIndex(normalizedPath, false, {
            dispatchEvent: (event) => window.dispatchEvent(event),
          });
          setExternalChangeNoticeShown(false);
          window.dispatchEvent(
            new CustomEvent("alphaclaw:browse-tree-refresh"),
          );
          return;
        }
        if (!externalChangeNoticeShown) {
          showToast(
            "This file changed on disk. Save to overwrite or reload by re-opening.",
            "error",
          );
          setExternalChangeNoticeShown(true);
        }
      } catch {
        // Ignore transient refresh errors to avoid interrupting editing.
      } finally {
        fileRefreshInFlightRef.current = false;
      }
    };
    const intervalId = window.setInterval(
      refreshFromDisk,
      kFileRefreshIntervalMs,
    );
    return () => {
      window.clearInterval(intervalId);
    };
  }, [
    hasSelectedPath,
    isFolderPath,
    canEditFile,
    loading,
    saving,
    normalizedPath,
    initialContent,
    isDirty,
    externalChangeNoticeShown,
  ]);

  useEffect(() => {
    let active = true;
    if (!hasSelectedPath || !isDiffView || isPreviewOnly) {
      setDiffLoading(false);
      setDiffError("");
      setDiffContent("");
      return () => {
        active = false;
      };
    }
    const loadDiff = async () => {
      setDiffLoading(true);
      setDiffError("");
      try {
        const data = await fetchBrowseFileDiff(normalizedPath);
        if (!active) return;
        setDiffContent(String(data?.content || ""));
      } catch (nextError) {
        if (!active) return;
        setDiffError(nextError.message || "Could not load diff");
      } finally {
        if (active) setDiffLoading(false);
      }
    };
    loadDiff();
    return () => {
      active = false;
    };
  }, [hasSelectedPath, isDiffView, isPreviewOnly, normalizedPath]);

  useEffect(() => {
    if (loadedFilePathRef.current !== normalizedPath) return;
    if (!canEditFile || !hasSelectedPath || loading) return;
    if (content === initialContent) {
      clearStoredFileDraft(normalizedPath);
      updateDraftIndex(normalizedPath, false, {
        dispatchEvent: (event) => window.dispatchEvent(event),
      });
      return;
    }
    writeStoredFileDraft(normalizedPath, content);
    updateDraftIndex(normalizedPath, true, {
      dispatchEvent: (event) => window.dispatchEvent(event),
    });
  }, [
    canEditFile,
    hasSelectedPath,
    loading,
    content,
    initialContent,
    normalizedPath,
  ]);

  useEffect(() => {
    if (!canEditFile || loading || !hasSelectedPath) return () => {};
    if (loadedFilePathRef.current !== normalizedPath) return () => {};
    if (restoredSelectionPathRef.current === normalizedPath) return () => {};
    if (viewMode !== "edit") return () => {};
    const storedSelection = readStoredEditorSelection(normalizedPath);
    if (!storedSelection) {
      restoredSelectionPathRef.current = normalizedPath;
      return () => {};
    }
    let frameId = 0;
    let attempts = 0;
    const restoreSelection = () => {
      const textareaElement = editorTextareaRef.current;
      if (!textareaElement) {
        attempts += 1;
        if (attempts < 6)
          frameId = window.requestAnimationFrame(restoreSelection);
        return;
      }
      const maxIndex = String(content || "").length;
      const start = clampSelectionIndex(storedSelection.start, maxIndex);
      const end = clampSelectionIndex(storedSelection.end, maxIndex);
      textareaElement.focus();
      textareaElement.setSelectionRange(start, Math.max(start, end));
      window.requestAnimationFrame(() => {
        const nextTextareaElement = editorTextareaRef.current;
        if (!nextTextareaElement) return;
        const safeContent = String(content || "");
        const safeStart = clampSelectionIndex(start, safeContent.length);
        const lineIndex =
          safeContent.slice(0, safeStart).split("\n").length - 1;
        const computedStyle = window.getComputedStyle(nextTextareaElement);
        const parsedLineHeight = Number.parseFloat(
          computedStyle.lineHeight || "",
        );
        const lineHeight =
          Number.isFinite(parsedLineHeight) && parsedLineHeight > 0
            ? parsedLineHeight
            : 20;
        const nextScrollTop = Math.max(
          0,
          lineIndex * lineHeight - nextTextareaElement.clientHeight * 0.4,
        );
        nextTextareaElement.scrollTop = nextScrollTop;
        if (editorLineNumbersRef.current) {
          editorLineNumbersRef.current.scrollTop = nextScrollTop;
        }
        if (editorHighlightRef.current) {
          editorHighlightRef.current.scrollTop = nextScrollTop;
        }
        viewScrollRatioRef.current = getScrollRatio(nextTextareaElement);
      });
      restoredSelectionPathRef.current = normalizedPath;
    };
    frameId = window.requestAnimationFrame(restoreSelection);
    return () => {
      if (frameId) window.cancelAnimationFrame(frameId);
    };
  }, [
    canEditFile,
    loading,
    hasSelectedPath,
    normalizedPath,
    content,
    viewMode,
  ]);

  const handleSave = useCallback(async () => {
    if (!canEditFile || saving || !isDirty || isEditBlocked) return;
    setSaving(true);
    setError("");
    try {
      await saveFileContent(normalizedPath, content);
      setInitialContent(content);
      setExternalChangeNoticeShown(false);
      clearStoredFileDraft(normalizedPath);
      updateDraftIndex(normalizedPath, false, {
        dispatchEvent: (event) => window.dispatchEvent(event),
      });
      window.dispatchEvent(
        new CustomEvent("alphaclaw:browse-file-saved", {
          detail: { path: normalizedPath },
        }),
      );
      showToast("Saved", "success");
    } catch (saveError) {
      const message = saveError.message || "Could not save file";
      setError(message);
      showToast(message, "error");
    } finally {
      setSaving(false);
    }
  }, [
    canEditFile,
    saving,
    isDirty,
    isEditBlocked,
    normalizedPath,
    content,
    initialContent,
  ]);

  useEffect(() => {
    const handleKeyDown = (event) => {
      const isSaveShortcut =
        (event.metaKey || event.ctrlKey) &&
        !event.shiftKey &&
        !event.altKey &&
        String(event.key || "").toLowerCase() === "s";
      if (!isSaveShortcut) return;
      if (!canEditFile || isPreviewOnly || isDiffView || viewMode !== "edit") return;
      event.preventDefault();
      void handleSave();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [canEditFile, isPreviewOnly, isDiffView, viewMode, handleSave]);

  const handleEditProtectedFile = () => {
    if (!normalizedPolicyPath) return;
    setProtectedEditBypassPaths((previousPaths) => {
      const nextPaths = new Set(previousPaths);
      nextPaths.add(normalizedPolicyPath);
      return nextPaths;
    });
  };

  const handleContentInput = (event) => {
    if (isEditBlocked || isPreviewOnly) return;
    const nextContent = event.target.value;
    setContent(nextContent);
    if (hasSelectedPath && canEditFile) {
      writeStoredEditorSelection(normalizedPath, {
        start: event.target.selectionStart,
        end: event.target.selectionEnd,
      });
    }
    if (hasSelectedPath && canEditFile) {
      writeStoredFileDraft(normalizedPath, nextContent);
      updateDraftIndex(normalizedPath, nextContent !== initialContent, {
        dispatchEvent: (event) => window.dispatchEvent(event),
      });
    }
  };

  const handleEditorSelectionChange = () => {
    if (!hasSelectedPath || !canEditFile || loading) return;
    const textareaElement = editorTextareaRef.current;
    if (!textareaElement) return;
    writeStoredEditorSelection(normalizedPath, {
      start: textareaElement.selectionStart,
      end: textareaElement.selectionEnd,
    });
  };

  const getScrollRatio = (element) => {
    if (!element) return 0;
    const maxScrollTop = element.scrollHeight - element.clientHeight;
    if (maxScrollTop <= 0) return 0;
    return element.scrollTop / maxScrollTop;
  };

  const setScrollByRatio = (element, ratio) => {
    if (!element) return;
    const maxScrollTop = element.scrollHeight - element.clientHeight;
    if (maxScrollTop <= 0) {
      element.scrollTop = 0;
      return;
    }
    const clampedRatio = Math.max(0, Math.min(1, ratio));
    element.scrollTop = maxScrollTop * clampedRatio;
  };

  const handleEditorScroll = (event) => {
    if (isSyncingScrollRef.current) return;
    const nextScrollTop = event.currentTarget.scrollTop;
    const nextRatio = getScrollRatio(event.currentTarget);
    viewScrollRatioRef.current = nextRatio;
    if (!editorLineNumbersRef.current) return;
    editorLineNumbersRef.current.scrollTop = nextScrollTop;
    if (editorHighlightRef.current) {
      editorHighlightRef.current.scrollTop = nextScrollTop;
      editorHighlightRef.current.scrollLeft = event.currentTarget.scrollLeft;
    }
    if (previewRef.current) {
      isSyncingScrollRef.current = true;
      setScrollByRatio(previewRef.current, nextRatio);
      window.requestAnimationFrame(() => {
        isSyncingScrollRef.current = false;
      });
    }
  };

  const handlePreviewScroll = (event) => {
    if (isSyncingScrollRef.current) return;
    const nextRatio = getScrollRatio(event.currentTarget);
    viewScrollRatioRef.current = nextRatio;
    isSyncingScrollRef.current = true;
    setScrollByRatio(editorTextareaRef.current, nextRatio);
    setScrollByRatio(editorLineNumbersRef.current, nextRatio);
    setScrollByRatio(editorHighlightRef.current, nextRatio);
    window.requestAnimationFrame(() => {
      isSyncingScrollRef.current = false;
    });
  };

  const handleChangeViewMode = (nextMode) => {
    if (nextMode === viewMode) return;
    const nextRatio =
      viewMode === "preview"
        ? getScrollRatio(previewRef.current)
        : getScrollRatio(editorTextareaRef.current);
    viewScrollRatioRef.current = nextRatio;
    setViewMode(nextMode);
    window.requestAnimationFrame(() => {
      isSyncingScrollRef.current = true;
      if (nextMode === "preview") {
        setScrollByRatio(previewRef.current, nextRatio);
      } else {
        setScrollByRatio(editorTextareaRef.current, nextRatio);
        setScrollByRatio(editorLineNumbersRef.current, nextRatio);
        setScrollByRatio(editorHighlightRef.current, nextRatio);
      }
      window.requestAnimationFrame(() => {
        isSyncingScrollRef.current = false;
      });
    });
  };

  if (!hasSelectedPath) {
    return html`
      <div class="file-viewer-empty">
        <div class="file-viewer-empty-mark">[ ]</div>
        <div class="file-viewer-empty-title">
          Browse and edit files<br />Syncs to git
        </div>
      </div>
    `;
  }

  return html`
    <div class="file-viewer">
      <div class="file-viewer-tabbar">
        <div class="file-viewer-tab active">
          <span class="file-icon">f</span>
          <span class="file-viewer-breadcrumb">
            ${pathSegments.map(
              (segment, index) => html`
                <span class="file-viewer-breadcrumb-item">
                  <span
                    class=${index === pathSegments.length - 1
                      ? "is-current"
                      : ""}
                  >
                    ${segment}
                  </span>
                  ${index < pathSegments.length - 1 &&
                  html`<span class="file-viewer-sep">></span>`}
                </span>
              `,
            )}
          </span>
          ${isDirty
            ? html`<span
                class="file-viewer-dirty-dot"
                aria-hidden="true"
              ></span>`
            : null}
        </div>
        <div class="file-viewer-tabbar-spacer"></div>
        ${isPreviewOnly
          ? html`<div class="file-viewer-preview-pill">Preview</div>`
          : null}
        ${!isDiffView &&
        isMarkdownFile &&
        html`
          <${SegmentedControl}
            className="mr-2.5"
            options=${[
              { label: "edit", value: "edit" },
              { label: "preview", value: "preview" },
            ]}
            value=${viewMode}
            onChange=${handleChangeViewMode}
          />
        `}
        ${!isDiffView
          ? !isImageFile && !isAudioFile
            ? html`
              <${ActionButton}
                onClick=${handleSave}
                disabled=${loading || !isDirty || !canEditFile || isEditBlocked}
                loading=${saving}
                tone=${isDirty ? "primary" : "secondary"}
                size="sm"
                idleLabel="Save"
                loadingLabel="Saving..."
                idleIcon=${SaveFillIcon}
                idleIconClassName="file-viewer-save-icon"
                className="file-viewer-save-action"
              />
            `
            : null
          : null}
      </div>
      ${isDiffView
        ? html`
            <div class="file-viewer-protected-banner file-viewer-diff-banner">
              <div class="file-viewer-protected-banner-text">
                Viewing unsynced changes
              </div>
              <${ActionButton}
                onClick=${() => onRequestEdit(normalizedPath)}
                tone="secondary"
                size="sm"
                idleLabel="View file"
              />
            </div>
          `
        : null}
      ${!isDiffView && isLockedFile
        ? html`
            <div class="file-viewer-protected-banner is-locked">
              <${LockLineIcon} className="file-viewer-protected-banner-icon" />
              <div class="file-viewer-protected-banner-text">
                This file is managed by Alpha Claw and cannot be edited.
              </div>
            </div>
          `
        : null}
      ${!isDiffView && isProtectedFile
        ? html`
            <div class="file-viewer-protected-banner">
              <div class="file-viewer-protected-banner-text">
                Protected file. Changes may break workspace behavior.
              </div>
              ${isProtectedLocked
                ? html`
                    <${ActionButton}
                      onClick=${handleEditProtectedFile}
                      tone="warning"
                      size="sm"
                      idleLabel="Edit anyway"
                    />
                  `
                : null}
            </div>
          `
        : null}
      ${isMarkdownFile && parsedFrontmatter.entries.length > 0
        ? html`
            <div class="frontmatter-box">
              <button
                type="button"
                class="frontmatter-title"
                onclick=${() =>
                  setFrontmatterCollapsed((collapsed) => !collapsed)}
              >
                <span
                  class=${`frontmatter-chevron ${frontmatterCollapsed ? "" : "open"}`}
                  aria-hidden="true"
                >
                  <svg viewBox="0 0 20 20" focusable="false">
                    <path d="M7 4l6 6-6 6" />
                  </svg>
                </span>
                <span>frontmatter</span>
              </button>
              ${!frontmatterCollapsed
                ? html`
                    <div class="frontmatter-grid">
                      ${parsedFrontmatter.entries.map((entry) => {
                        const formattedValue = formatFrontmatterValue(
                          entry.rawValue,
                        );
                        const isMultilineValue = formattedValue.includes("\n");
                        return html`
                          <div class="frontmatter-row" key=${entry.key}>
                            <div class="frontmatter-key">${entry.key}</div>
                            ${isMultilineValue
                              ? html`
                                  <pre
                                    class="frontmatter-value frontmatter-value-pre"
                                  >
${formattedValue}</pre
                                  >
                                `
                              : html`<div class="frontmatter-value">
                                  ${formattedValue}
                                </div>`}
                          </div>
                        `;
                      })}
                    </div>
                  `
                : null}
            </div>
          `
        : null}
      ${loading
        ? html`
            <div class="file-viewer-loading-shell">
              ${showDelayedLoadingSpinner
                ? html`<${LoadingSpinner} className="h-4 w-4" />`
                : null}
            </div>
          `
        : error
          ? html`<div class="file-viewer-state file-viewer-state-error">
              ${error}
            </div>`
          : isFolderPath
            ? html`
                <div class="file-viewer-state">
                  Folder selected. Choose a file from this folder in the tree.
                </div>
              `
            : isImageFile
              ? html`
                  <div class="file-viewer-image-shell">
                    ${imageDataUrl
                      ? html`
                          <img
                            src=${imageDataUrl}
                            alt=${pathSegments[pathSegments.length - 1] || "Selected image"}
                            class="file-viewer-image"
                          />
                        `
                      : html`
                          <div class="file-viewer-state">
                            Could not render image preview.
                          </div>
                        `}
                  </div>
                `
            : isAudioFile
              ? html`
                  <div class="file-viewer-audio-shell">
                    ${audioDataUrl
                      ? html`
                          <audio
                            class="file-viewer-audio-player"
                            controls
                            preload="metadata"
                            src=${audioDataUrl}
                          >
                            Your browser does not support audio playback.
                          </audio>
                        `
                      : html`
                          <div class="file-viewer-state">
                            Could not render audio preview.
                          </div>
                        `}
                  </div>
                `
            : isDiffView
              ? html`
                  <div class="file-viewer-diff-shell">
                    ${diffLoading
                      ? html`
                          <div class="file-viewer-loading-shell">
                            <${LoadingSpinner} className="h-4 w-4" />
                          </div>
                        `
                      : diffError
                        ? html`
                            <div
                              class="file-viewer-state file-viewer-state-error"
                            >
                              ${diffError}
                            </div>
                          `
                        : html`
                            <pre class="file-viewer-diff-pre">
${(diffContent || "").split("\n").map((line, lineIndex) => {
                                const lineClass =
                                  line.startsWith("+") &&
                                  !line.startsWith("+++")
                                    ? "is-added"
                                    : line.startsWith("-") &&
                                        !line.startsWith("---")
                                      ? "is-removed"
                                      : line.startsWith("@@")
                                        ? "is-hunk"
                                        : line.startsWith("diff ") ||
                                            line.startsWith("index ") ||
                                            line.startsWith("--- ") ||
                                            line.startsWith("+++ ")
                                          ? "is-header"
                                          : "";
                                return html`
                                  <div
                                    key=${`${lineIndex}:${line.slice(0, 20)}`}
                                    class=${`file-viewer-diff-line ${lineClass}`.trim()}
                                  >
                                    ${line || " "}
                                  </div>
                                `;
                              })}
                            </pre
                            >
                          `}
                  </div>
                `
              : html`
                  ${isMarkdownFile
                    ? html`
                        <div
                          class=${`file-viewer-preview ${viewMode === "preview" ? "" : "file-viewer-pane-hidden"}`}
                          ref=${previewRef}
                          onscroll=${handlePreviewScroll}
                          aria-hidden=${viewMode === "preview"
                            ? "false"
                            : "true"}
                          dangerouslySetInnerHTML=${{ __html: previewHtml }}
                        ></div>
                        <div
                          class=${`file-viewer-editor-shell ${viewMode === "edit" ? "" : "file-viewer-pane-hidden"}`}
                          aria-hidden=${viewMode === "edit" ? "false" : "true"}
                        >
                          <div
                            class="file-viewer-editor-line-num-col"
                            ref=${editorLineNumbersRef}
                          >
                            ${editorLineNumbers.map(
                              (lineNumber) => html`
                                <div
                                  class="file-viewer-editor-line-num"
                                  key=${lineNumber}
                                  ref=${(element) => {
                                    editorLineNumberRowRefs.current[
                                      lineNumber - 1
                                    ] = element;
                                  }}
                                >
                                  ${lineNumber}
                                </div>
                              `,
                            )}
                          </div>
                          <div class="file-viewer-editor-stack">
                            <div
                              class="file-viewer-editor-highlight"
                              ref=${editorHighlightRef}
                            >
                              ${highlightedEditorLines.map(
                                (line) => html`
                                  <div
                                    class="file-viewer-editor-highlight-line"
                                    key=${line.lineNumber}
                                    ref=${(element) => {
                                      editorHighlightLineRefs.current[
                                        line.lineNumber - 1
                                      ] = element;
                                    }}
                                  >
                                    <span
                                      class="file-viewer-editor-highlight-line-content"
                                      dangerouslySetInnerHTML=${{
                                        __html: line.html,
                                      }}
                                    ></span>
                                  </div>
                                `,
                              )}
                            </div>
                            <textarea
                              class="file-viewer-editor file-viewer-editor-overlay"
                              ref=${editorTextareaRef}
                              value=${renderContent}
                              onInput=${handleContentInput}
                              onScroll=${handleEditorScroll}
                              onSelect=${handleEditorSelectionChange}
                              onKeyUp=${handleEditorSelectionChange}
                              onClick=${handleEditorSelectionChange}
                              disabled=${isEditBlocked || isPreviewOnly}
                              readonly=${isEditBlocked || isPreviewOnly}
                              spellcheck=${false}
                              autocorrect="off"
                              autocapitalize="off"
                              autocomplete="off"
                              data-gramm="false"
                              data-gramm_editor="false"
                              data-enable-grammarly="false"
                              wrap="soft"
                            ></textarea>
                          </div>
                        </div>
                      `
                    : html`
                        <div class="file-viewer-editor-shell">
                          <div
                            class="file-viewer-editor-line-num-col"
                            ref=${editorLineNumbersRef}
                          >
                            ${editorLineNumbers.map(
                              (lineNumber) => html`
                                <div
                                  class="file-viewer-editor-line-num"
                                  key=${lineNumber}
                                  ref=${(element) => {
                                    editorLineNumberRowRefs.current[
                                      lineNumber - 1
                                    ] = element;
                                  }}
                                >
                                  ${lineNumber}
                                </div>
                              `,
                            )}
                          </div>
                          ${shouldUseHighlightedEditor
                            ? html`
                                <div class="file-viewer-editor-stack">
                                  <div
                                    class="file-viewer-editor-highlight"
                                    ref=${editorHighlightRef}
                                  >
                                    ${highlightedEditorLines.map(
                                      (line) => html`
                                        <div
                                          class="file-viewer-editor-highlight-line"
                                          key=${line.lineNumber}
                                          ref=${(element) => {
                                            editorHighlightLineRefs.current[
                                              line.lineNumber - 1
                                            ] = element;
                                          }}
                                        >
                                          <span
                                            class="file-viewer-editor-highlight-line-content"
                                            dangerouslySetInnerHTML=${{
                                              __html: line.html,
                                            }}
                                          ></span>
                                        </div>
                                      `,
                                    )}
                                  </div>
                                  <textarea
                                    class="file-viewer-editor file-viewer-editor-overlay"
                                    ref=${editorTextareaRef}
                                    value=${renderContent}
                                    onInput=${handleContentInput}
                                    onScroll=${handleEditorScroll}
                                    onSelect=${handleEditorSelectionChange}
                                    onKeyUp=${handleEditorSelectionChange}
                                    onClick=${handleEditorSelectionChange}
                                    disabled=${isEditBlocked || isPreviewOnly}
                                    readonly=${isEditBlocked || isPreviewOnly}
                                    spellcheck=${false}
                                    autocorrect="off"
                                    autocapitalize="off"
                                    autocomplete="off"
                                    data-gramm="false"
                                    data-gramm_editor="false"
                                    data-enable-grammarly="false"
                                    wrap="soft"
                                  ></textarea>
                                </div>
                              `
                            : html`
                                <textarea
                                  class="file-viewer-editor"
                                  ref=${editorTextareaRef}
                                  value=${renderContent}
                                  onInput=${handleContentInput}
                                  onScroll=${handleEditorScroll}
                                  onSelect=${handleEditorSelectionChange}
                                  onKeyUp=${handleEditorSelectionChange}
                                  onClick=${handleEditorSelectionChange}
                                  disabled=${isEditBlocked || isPreviewOnly}
                                  readonly=${isEditBlocked || isPreviewOnly}
                                  spellcheck=${false}
                                  autocorrect="off"
                                  autocapitalize="off"
                                  autocomplete="off"
                                  data-gramm="false"
                                  data-gramm_editor="false"
                                  data-enable-grammarly="false"
                                  wrap="soft"
                                ></textarea>
                              `}
                        </div>
                      `}
                `}
    </div>
  `;
};
