import { h } from "https://esm.sh/preact";
import { useCallback, useEffect, useMemo, useRef, useState } from "https://esm.sh/preact/hooks";
import htm from "https://esm.sh/htm";
import { marked } from "https://esm.sh/marked";
import { fetchBrowseFileDiff, saveFileContent } from "../../lib/api.js";
import {
  getFileSyntaxKind,
  highlightEditorLines,
  parseFrontmatter,
} from "../../lib/syntax-highlighters/index.js";
import {
  clearStoredFileDraft,
  updateDraftIndex,
  writeStoredFileDraft,
} from "../../lib/browse-draft-state.js";
import {
  kLockedBrowsePaths,
  kProtectedBrowsePaths,
  matchesBrowsePolicyPath,
  normalizeBrowsePolicyPath,
} from "../../lib/browse-file-policies.js";
import { LoadingSpinner } from "../loading-spinner.js";
import { showToast } from "../toast.js";
import {
  kFileViewerModeStorageKey,
  kLoadingIndicatorDelayMs,
  kSqlitePageSize,
} from "./constants.js";
import {
  readStoredEditorSelection,
  readStoredFileViewerMode,
  writeStoredEditorSelection,
} from "./storage.js";
import { clampSelectionIndex, parsePathSegments } from "./utils.js";
import { getScrollRatio, useScrollSync } from "./scroll-sync.js";
import { useFileLoader } from "./use-file-loader.js";
import { SqliteViewer } from "./sqlite-viewer.js";
import { FileViewerToolbar } from "./toolbar.js";
import { FileViewerStatusBanners } from "./status-banners.js";
import { FrontmatterPanel } from "./frontmatter-panel.js";
import { DiffViewer } from "./diff-viewer.js";
import { MediaPreview } from "./media-preview.js";
import { EditorSurface } from "./editor-surface.js";
import { MarkdownSplitView } from "./markdown-split-view.js";

const html = htm.bind(h);

export const FileViewer = ({
  filePath = "",
  isPreviewOnly = false,
  browseView = "edit",
  onRequestEdit = () => {},
}) => {
  const normalizedPath = String(filePath || "").trim();
  const normalizedPolicyPath = normalizeBrowsePolicyPath(normalizedPath);
  const [content, setContent] = useState("");
  const [initialContent, setInitialContent] = useState("");
  const [fileKind, setFileKind] = useState("text");
  const [imageDataUrl, setImageDataUrl] = useState("");
  const [audioDataUrl, setAudioDataUrl] = useState("");
  const [sqliteSummary, setSqliteSummary] = useState(null);
  const [sqliteSelectedTable, setSqliteSelectedTable] = useState("");
  const [sqliteTableOffset, setSqliteTableOffset] = useState(0);
  const [sqliteTableLoading, setSqliteTableLoading] = useState(false);
  const [sqliteTableError, setSqliteTableError] = useState("");
  const [sqliteTableData, setSqliteTableData] = useState(null);
  const [viewMode, setViewMode] = useState(readStoredFileViewerMode);
  const [loading, setLoading] = useState(false);
  const [showDelayedLoadingSpinner, setShowDelayedLoadingSpinner] = useState(false);
  const [diffLoading, setDiffLoading] = useState(false);
  const [diffError, setDiffError] = useState("");
  const [diffContent, setDiffContent] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [isFolderPath, setIsFolderPath] = useState(false);
  const [frontmatterCollapsed, setFrontmatterCollapsed] = useState(false);
  const [externalChangeNoticeShown, setExternalChangeNoticeShown] = useState(false);
  const [protectedEditBypassPaths, setProtectedEditBypassPaths] = useState(() => new Set());
  const editorLineNumbersRef = useRef(null);
  const editorHighlightRef = useRef(null);
  const editorTextareaRef = useRef(null);
  const previewRef = useRef(null);
  const editorLineNumberRowRefs = useRef([]);
  const editorHighlightLineRefs = useRef([]);

  const hasSelectedPath = normalizedPath.length > 0;
  const isImageFile = fileKind === "image";
  const isAudioFile = fileKind === "audio";
  const isSqliteFile = fileKind === "sqlite";
  const canEditFile =
    hasSelectedPath && !isFolderPath && !isPreviewOnly && !isImageFile && !isAudioFile && !isSqliteFile;
  const isDiffView = String(browseView || "edit") === "diff";

  const { viewScrollRatioRef, handleEditorScroll, handlePreviewScroll, handleChangeViewMode } =
    useScrollSync({
      viewMode,
      setViewMode,
      previewRef,
      editorTextareaRef,
      editorLineNumbersRef,
      editorHighlightRef,
    });

  const { loadedFilePathRef, restoredSelectionPathRef } = useFileLoader({
    hasSelectedPath,
    normalizedPath,
    isSqliteFile,
    sqliteSelectedTable,
    sqliteTableOffset,
    canEditFile,
    isFolderPath,
    loading,
    saving,
    initialContent,
    isDirty: canEditFile && content !== initialContent,
    setLoading,
    setContent,
    setInitialContent,
    setFileKind,
    setImageDataUrl,
    setAudioDataUrl,
    setSqliteSummary,
    setSqliteSelectedTable,
    setSqliteTableOffset,
    setSqliteTableLoading,
    setSqliteTableError,
    setSqliteTableData,
    setError,
    setIsFolderPath,
    setExternalChangeNoticeShown,
    externalChangeNoticeShown,
    viewScrollRatioRef,
  });

  const pathSegments = useMemo(() => parsePathSegments(normalizedPath), [normalizedPath]);
  const isCurrentFileLoaded = loadedFilePathRef.current === normalizedPath;
  const renderContent = isCurrentFileLoaded ? content : "";
  const renderInitialContent = isCurrentFileLoaded ? initialContent : "";
  const isDirty = canEditFile && renderContent !== renderInitialContent;
  const isLockedFile =
    canEditFile && matchesBrowsePolicyPath(kLockedBrowsePaths, normalizedPolicyPath);
  const isProtectedFile =
    canEditFile &&
    !isLockedFile &&
    matchesBrowsePolicyPath(kProtectedBrowsePaths, normalizedPolicyPath);
  const isProtectedLocked = isProtectedFile && !protectedEditBypassPaths.has(normalizedPolicyPath);
  const isEditBlocked = isLockedFile || isProtectedLocked;
  const syntaxKind = useMemo(() => getFileSyntaxKind(normalizedPath), [normalizedPath]);
  const isMarkdownFile = syntaxKind === "markdown";
  const shouldUseHighlightedEditor = syntaxKind !== "plain";
  const parsedFrontmatter = useMemo(
    () => (isMarkdownFile ? parseFrontmatter(renderContent) : { entries: [], body: renderContent }),
    [renderContent, isMarkdownFile],
  );
  const highlightedEditorLines = useMemo(
    () => (shouldUseHighlightedEditor ? highlightEditorLines(renderContent, syntaxKind) : []),
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
  }, [canEditFile, hasSelectedPath, loading, content, initialContent, normalizedPath]);

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
        if (attempts < 6) frameId = window.requestAnimationFrame(restoreSelection);
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
        const lineIndex = safeContent.slice(0, safeStart).split("\n").length - 1;
        const computedStyle = window.getComputedStyle(nextTextareaElement);
        const parsedLineHeight = Number.parseFloat(computedStyle.lineHeight || "");
        const lineHeight =
          Number.isFinite(parsedLineHeight) && parsedLineHeight > 0 ? parsedLineHeight : 20;
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
  }, [canEditFile, loading, hasSelectedPath, normalizedPath, content, viewMode]);

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
  }, [canEditFile, saving, isDirty, isEditBlocked, normalizedPath, content, initialContent]);

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
        dispatchEvent: (dispatchEvent) => window.dispatchEvent(dispatchEvent),
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

  if (!hasSelectedPath) {
    return html`
      <div class="file-viewer-empty">
        <div class="file-viewer-empty-mark">[ ]</div>
        <div class="file-viewer-empty-title">Browse and edit files<br />Syncs to git</div>
      </div>
    `;
  }

  return html`
    <div class="file-viewer">
      <${FileViewerToolbar}
        pathSegments=${pathSegments}
        isDirty=${isDirty}
        isPreviewOnly=${isPreviewOnly}
        isDiffView=${isDiffView}
        isMarkdownFile=${isMarkdownFile}
        viewMode=${viewMode}
        handleChangeViewMode=${handleChangeViewMode}
        handleSave=${handleSave}
        loading=${loading}
        canEditFile=${canEditFile}
        isEditBlocked=${isEditBlocked}
        isImageFile=${isImageFile}
        isAudioFile=${isAudioFile}
        isSqliteFile=${isSqliteFile}
        saving=${saving}
      />
      <${FileViewerStatusBanners}
        isDiffView=${isDiffView}
        onRequestEdit=${onRequestEdit}
        normalizedPath=${normalizedPath}
        isLockedFile=${isLockedFile}
        isProtectedFile=${isProtectedFile}
        isProtectedLocked=${isProtectedLocked}
        handleEditProtectedFile=${handleEditProtectedFile}
      />
      <${FrontmatterPanel}
        isMarkdownFile=${isMarkdownFile}
        parsedFrontmatter=${parsedFrontmatter}
        frontmatterCollapsed=${frontmatterCollapsed}
        setFrontmatterCollapsed=${setFrontmatterCollapsed}
      />
      ${loading
        ? html`
            <div class="file-viewer-loading-shell">
              ${showDelayedLoadingSpinner
                ? html`<${LoadingSpinner} className="h-4 w-4" />`
                : null}
            </div>
          `
        : error
          ? html`<div class="file-viewer-state file-viewer-state-error">${error}</div>`
          : isFolderPath
            ? html`
                <div class="file-viewer-state">
                  Folder selected. Choose a file from this folder in the tree.
                </div>
              `
            : isImageFile || isAudioFile
              ? html`
                  <${MediaPreview}
                    isImageFile=${isImageFile}
                    imageDataUrl=${imageDataUrl}
                    pathSegments=${pathSegments}
                    isAudioFile=${isAudioFile}
                    audioDataUrl=${audioDataUrl}
                  />
                `
                : isSqliteFile
                  ? html`
                      <${SqliteViewer}
                        sqliteSummary=${sqliteSummary}
                        sqliteSelectedTable=${sqliteSelectedTable}
                        setSqliteSelectedTable=${setSqliteSelectedTable}
                        sqliteTableOffset=${sqliteTableOffset}
                        setSqliteTableOffset=${setSqliteTableOffset}
                        sqliteTableLoading=${sqliteTableLoading}
                        sqliteTableError=${sqliteTableError}
                        sqliteTableData=${sqliteTableData}
                        kSqlitePageSize=${kSqlitePageSize}
                      />
                    `
                  : isDiffView
                    ? html`<${DiffViewer} diffLoading=${diffLoading} diffError=${diffError} diffContent=${diffContent} />`
                    : html`
                        ${isMarkdownFile
                          ? html`
                              <${MarkdownSplitView}
                                viewMode=${viewMode}
                                previewRef=${previewRef}
                                handlePreviewScroll=${handlePreviewScroll}
                                previewHtml=${previewHtml}
                                editorLineNumbers=${editorLineNumbers}
                                editorLineNumbersRef=${editorLineNumbersRef}
                                editorLineNumberRowRefs=${editorLineNumberRowRefs}
                                highlightedEditorLines=${highlightedEditorLines}
                                editorHighlightRef=${editorHighlightRef}
                                editorHighlightLineRefs=${editorHighlightLineRefs}
                                editorTextareaRef=${editorTextareaRef}
                                renderContent=${renderContent}
                                handleContentInput=${handleContentInput}
                                handleEditorScroll=${handleEditorScroll}
                                handleEditorSelectionChange=${handleEditorSelectionChange}
                                isEditBlocked=${isEditBlocked}
                                isPreviewOnly=${isPreviewOnly}
                              />
                            `
                          : html`
                              <${EditorSurface}
                                editorLineNumbers=${editorLineNumbers}
                                editorLineNumbersRef=${editorLineNumbersRef}
                                editorLineNumberRowRefs=${editorLineNumberRowRefs}
                                shouldUseHighlightedEditor=${shouldUseHighlightedEditor}
                                highlightedEditorLines=${highlightedEditorLines}
                                editorHighlightRef=${editorHighlightRef}
                                editorHighlightLineRefs=${editorHighlightLineRefs}
                                editorTextareaRef=${editorTextareaRef}
                                renderContent=${renderContent}
                                handleContentInput=${handleContentInput}
                                handleEditorScroll=${handleEditorScroll}
                                handleEditorSelectionChange=${handleEditorSelectionChange}
                                isEditBlocked=${isEditBlocked}
                                isPreviewOnly=${isPreviewOnly}
                              />
                            `}
                      `}
    </div>
  `;
};
