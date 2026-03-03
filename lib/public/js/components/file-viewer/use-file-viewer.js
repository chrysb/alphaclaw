import { useCallback, useEffect, useMemo, useRef, useState } from "https://esm.sh/preact/hooks";
import { marked } from "https://esm.sh/marked";
import { saveFileContent } from "../../lib/api.js";
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
import { kFileViewerModeStorageKey, kLoadingIndicatorDelayMs } from "./constants.js";
import { readStoredFileViewerMode, writeStoredEditorSelection } from "./storage.js";
import { parsePathSegments } from "./utils.js";
import { useScrollSync } from "./scroll-sync.js";
import { useFileLoader } from "./use-file-loader.js";
import { useFileDiff } from "./use-file-diff.js";
import { useFileViewerDraftSync } from "./use-file-viewer-draft-sync.js";
import { useFileViewerHotkeys } from "./use-file-viewer-hotkeys.js";
import { useEditorSelectionRestore } from "./use-editor-selection-restore.js";

export const useFileViewer = ({
  filePath = "",
  isPreviewOnly = false,
  browseView = "edit",
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

  const { diffLoading, diffError, diffContent } = useFileDiff({
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
    loading,
    hasSelectedPath,
    normalizedPath,
    loadedFilePathRef,
    restoredSelectionPathRef,
    viewMode,
    content,
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
      showToast("Saved", "success");
    } catch (saveError) {
      const message = saveError.message || "Could not save file";
      setError(message);
      showToast(message, "error");
    } finally {
      setSaving(false);
    }
  }, [canEditFile, saving, isDirty, isEditBlocked, normalizedPath, content]);

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

  return {
    state: {
      hasSelectedPath,
      isPreviewOnly,
      loading,
      saving,
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
      isEditBlocked,
      isLockedFile,
      isProtectedFile,
      isProtectedLocked,
      shouldUseHighlightedEditor,
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
      handleEditProtectedFile,
      handleContentInput,
      handleEditorScroll,
      handlePreviewScroll,
      handleEditorSelectionChange,
    },
    context: {
      normalizedPath,
    },
  };
};
