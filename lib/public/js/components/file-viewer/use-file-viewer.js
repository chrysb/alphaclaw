import { useCallback, useEffect, useMemo, useRef, useState } from "https://esm.sh/preact/hooks";
import { marked } from "https://esm.sh/marked";
import { deleteBrowseFile, restoreBrowseFile, saveFileContent } from "../../lib/api.js";
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
import { showToast } from "../toast.js";
import {
  kFileViewerModeStorageKey,
  kLargeFileSimpleEditorCharThreshold,
  kLargeFileSimpleEditorLineThreshold,
  kLoadingIndicatorDelayMs,
} from "./constants.js";
import { readStoredFileViewerMode, writeStoredEditorSelection } from "./storage.js";
import { countTextLines, parsePathSegments, shouldUseSimpleEditorMode } from "./utils.js";
import { useScrollSync } from "./scroll-sync.js";
import { useFileLoader } from "./use-file-loader.js";
import { useFileDiff } from "./use-file-diff.js";
import { useFileViewerDraftSync } from "./use-file-viewer-draft-sync.js";
import { useFileViewerHotkeys } from "./use-file-viewer-hotkeys.js";
import { useEditorSelectionRestore } from "./use-editor-selection-restore.js";
import { useEditorLineNumberSync } from "./use-editor-line-number-sync.js";

export const useFileViewer = ({
  filePath = "",
  isPreviewOnly = false,
  browseView = "edit",
  lineTarget = 0,
  lineEndTarget = 0,
  onRequestClearSelection = () => {},
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
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [restoring, setRestoring] = useState(false);
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
    isDiffView,
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

  const { diffLoading, diffError, diffContent, diffStatus } = useFileDiff({
    hasSelectedPath,
    isDiffView,
    isPreviewOnly,
    normalizedPath,
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
  const isDeleteBlocked = isLockedFile || isProtectedFile;
  const canDeleteFile =
    hasSelectedPath &&
    !isFolderPath &&
    !isPreviewOnly &&
    !isDiffView &&
    !deleting &&
    !saving &&
    !isDeleteBlocked;
  const syntaxKind = useMemo(() => getFileSyntaxKind(normalizedPath), [normalizedPath]);
  const isMarkdownFile = syntaxKind === "markdown";
  const editorLineCount = useMemo(() => countTextLines(renderContent), [renderContent]);
  const useSimpleEditor = useMemo(
    () =>
      shouldUseSimpleEditorMode({
        contentLength: renderContent.length,
        lineCount: editorLineCount,
        charThreshold: kLargeFileSimpleEditorCharThreshold,
        lineThreshold: kLargeFileSimpleEditorLineThreshold,
      }),
    [renderContent, editorLineCount],
  );
  const shouldUseHighlightedEditor = syntaxKind !== "plain" && !useSimpleEditor;
  const shouldRenderLineNumbers = !useSimpleEditor;
  const parsedFrontmatter = useMemo(
    () => (isMarkdownFile ? parseFrontmatter(renderContent) : { entries: [], body: renderContent }),
    [renderContent, isMarkdownFile],
  );
  const highlightedEditorLines = useMemo(
    () => (shouldUseHighlightedEditor ? highlightEditorLines(renderContent, syntaxKind) : []),
    [renderContent, shouldUseHighlightedEditor, syntaxKind],
  );
  const editorLineNumbers = useMemo(() => {
    if (!shouldRenderLineNumbers) return [];
    return Array.from({ length: editorLineCount }, (_, index) => index + 1);
  }, [editorLineCount, shouldRenderLineNumbers]);
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

  useEditorLineNumberSync({
    enabled: shouldUseHighlightedEditor && viewMode === "edit",
    syncKey: `${normalizedPath}:${renderContent.length}:${highlightedEditorLines.length}`,
    editorLineNumberRowRefs,
    editorHighlightLineRefs,
  });

  useEffect(() => {
    if (!isMarkdownFile && viewMode !== "edit") {
      setViewMode("edit");
    }
  }, [isMarkdownFile, viewMode]);

  useEffect(() => {
    setProtectedEditBypassPaths(new Set());
  }, [normalizedPath]);

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

  useFileViewerDraftSync({
    loadedFilePathRef,
    normalizedPath,
    canEditFile,
    hasSelectedPath,
    loading,
    content,
    initialContent,
  });

  useEditorSelectionRestore({
    canEditFile,
    isEditBlocked,
    loading,
    hasSelectedPath,
    normalizedPath,
    loadedFilePathRef,
    restoredSelectionPathRef,
    viewMode,
    content,
    lineTarget,
    lineEndTarget,
    editorTextareaRef,
    editorLineNumbersRef,
    editorHighlightRef,
    viewScrollRatioRef,
  });

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
    } catch (saveError) {
      const message = saveError.message || "Could not save file";
      showToast(message, "error");
    } finally {
      setSaving(false);
    }
  }, [canEditFile, saving, isDirty, isEditBlocked, normalizedPath, content]);

  const handleDelete = useCallback(async () => {
    if (!canDeleteFile) return;
    setDeleting(true);
    setError("");
    try {
      const data = await deleteBrowseFile(normalizedPath);
      const deletedPath = String(data?.path || normalizedPath);
      setExternalChangeNoticeShown(false);
      clearStoredFileDraft(normalizedPath);
      updateDraftIndex(normalizedPath, false, {
        dispatchEvent: (event) => window.dispatchEvent(event),
      });
      window.dispatchEvent(
        new CustomEvent("alphaclaw:browse-file-saved", {
          detail: { path: deletedPath },
        }),
      );
      window.dispatchEvent(
        new CustomEvent("alphaclaw:browse-file-deleted", {
          detail: { path: deletedPath },
        }),
      );
      window.dispatchEvent(new CustomEvent("alphaclaw:browse-tree-refresh"));
      showToast("File deleted", "success");
      onRequestClearSelection();
    } catch (deleteError) {
      const message = deleteError.message || "Could not delete file";
      setError(message);
      if (/path is not a file/i.test(message)) {
        showToast("Only files can be deleted", "warning");
        onRequestClearSelection();
      } else {
        showToast(message, "error");
      }
    } finally {
      setDeleting(false);
    }
  }, [canDeleteFile, normalizedPath, onRequestClearSelection]);

  const handleRestore = useCallback(async () => {
    if (!isDiffView || !diffStatus?.isDeleted || restoring) return;
    setRestoring(true);
    try {
      const data = await restoreBrowseFile(normalizedPath);
      const restoredPath = String(data?.path || normalizedPath);
      window.dispatchEvent(
        new CustomEvent("alphaclaw:browse-file-saved", {
          detail: { path: restoredPath },
        }),
      );
      window.dispatchEvent(new CustomEvent("alphaclaw:browse-tree-refresh"));
      showToast("File restored", "success");
      onRequestEdit(restoredPath);
    } catch (restoreError) {
      showToast(restoreError.message || "Could not restore file", "error");
    } finally {
      setRestoring(false);
    }
  }, [
    diffStatus?.isDeleted,
    isDiffView,
    normalizedPath,
    onRequestEdit,
    restoring,
  ]);

  useFileViewerHotkeys({
    canEditFile,
    isPreviewOnly,
    isDiffView,
    viewMode,
    handleSave,
  });

  const handleEditProtectedFile = () => {
    if (!normalizedPolicyPath) return;
    setProtectedEditBypassPaths((previousPaths) => {
      const nextPaths = new Set(previousPaths);
      nextPaths.add(normalizedPolicyPath);
      return nextPaths;
    });
    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => {
        const textareaElement = editorTextareaRef.current;
        if (!textareaElement) return;
        if (textareaElement.disabled || textareaElement.readOnly) return;
        textareaElement.focus();
      });
    });
  };

  const persistDraftForContent = useCallback(
    (nextContent, selection = null) => {
      if (!hasSelectedPath || !canEditFile) return;
      if (selection) {
        writeStoredEditorSelection(normalizedPath, selection);
      }
      writeStoredFileDraft(normalizedPath, nextContent);
      updateDraftIndex(normalizedPath, nextContent !== initialContent, {
        dispatchEvent: (event) => window.dispatchEvent(event),
      });
    },
    [hasSelectedPath, canEditFile, normalizedPath, initialContent],
  );

  const handleContentInput = (event) => {
    if (isEditBlocked || isPreviewOnly) return;
    const nextContent = event.target.value;
    setContent(nextContent);
    persistDraftForContent(nextContent, {
      start: event.target.selectionStart,
      end: event.target.selectionEnd,
    });
  };

  const handleEditorKeyDown = (event) => {
    if (event.key !== "Tab") return;
    if (event.shiftKey || event.metaKey || event.ctrlKey || event.altKey) return;
    if (isEditBlocked || isPreviewOnly || !canEditFile) return;
    const textareaElement = event.currentTarget;
    if (!textareaElement) return;
    event.preventDefault();
    const start = Number(textareaElement.selectionStart || 0);
    const end = Number(textareaElement.selectionEnd || 0);
    textareaElement.setRangeText("  ", start, end, "end");
    const nextContent = textareaElement.value;
    setContent(nextContent);
    persistDraftForContent(nextContent, {
      start: textareaElement.selectionStart,
      end: textareaElement.selectionEnd,
    });
  };

  const handleDiscard = () => {
    if (!canEditFile || !isDirty || saving || deleting) return;
    setContent(initialContent);
    clearStoredFileDraft(normalizedPath);
    updateDraftIndex(normalizedPath, false, {
      dispatchEvent: (event) => window.dispatchEvent(event),
    });
    showToast("Changes discarded", "info");
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

  return {
    state: {
      hasSelectedPath,
      isPreviewOnly,
      loading,
      saving,
      deleting,
      restoring,
      showDelayedLoadingSpinner,
      error,
      isFolderPath,
      isImageFile,
      imageDataUrl,
      isAudioFile,
      audioDataUrl,
      isSqliteFile,
      sqliteSummary,
      sqliteSelectedTable,
      sqliteTableOffset,
      sqliteTableLoading,
      sqliteTableError,
      sqliteTableData,
      isDiffView,
      diffLoading,
      diffError,
      diffContent,
      diffStatus,
      isMarkdownFile,
      frontmatterCollapsed,
      previewHtml,
      viewMode,
      renderContent,
    },
    derived: {
      pathSegments,
      isDirty,
      canEditFile,
      canDeleteFile,
      isDeleteBlocked,
      isEditBlocked,
      isLockedFile,
      isProtectedFile,
      isProtectedLocked,
      shouldUseHighlightedEditor,
      shouldRenderLineNumbers,
      parsedFrontmatter,
      highlightedEditorLines,
      editorLineNumbers,
    },
    refs: {
      previewRef,
      editorLineNumbersRef,
      editorLineNumberRowRefs,
      editorHighlightRef,
      editorHighlightLineRefs,
      editorTextareaRef,
    },
    actions: {
      setFrontmatterCollapsed,
      setSqliteSelectedTable,
      setSqliteTableOffset,
      handleChangeViewMode,
      handleSave,
      handleDiscard,
      handleDelete,
      handleRestore,
      handleEditProtectedFile,
      handleContentInput,
      handleEditorKeyDown,
      handleEditorScroll,
      handlePreviewScroll,
      handleEditorSelectionChange,
    },
    context: {
      normalizedPath,
    },
  };
};
