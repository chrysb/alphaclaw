import { h } from "https://esm.sh/preact";
import { useCallback, useEffect, useMemo, useRef, useState } from "https://esm.sh/preact/hooks";
import htm from "https://esm.sh/htm";
import { marked } from "https://esm.sh/marked";
import { fetchBrowseFileDiff, saveFileContent } from "../../lib/api.js";
import {
  formatFrontmatterValue,
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
import { ActionButton } from "../action-button.js";
import { LoadingSpinner } from "../loading-spinner.js";
import { SegmentedControl } from "../segmented-control.js";
import { LockLineIcon, SaveFillIcon } from "../icons.js";
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
      <div class="file-viewer-tabbar">
        <div class="file-viewer-tab active">
          <span class="file-icon">f</span>
          <span class="file-viewer-breadcrumb">
            ${pathSegments.map(
              (segment, index) => html`
                <span class="file-viewer-breadcrumb-item">
                  <span class=${index === pathSegments.length - 1 ? "is-current" : ""}>
                    ${segment}
                  </span>
                  ${index < pathSegments.length - 1 &&
                  html`<span class="file-viewer-sep">></span>`}
                </span>
              `,
            )}
          </span>
          ${isDirty
            ? html`<span class="file-viewer-dirty-dot" aria-hidden="true"></span>`
            : null}
        </div>
        <div class="file-viewer-tabbar-spacer"></div>
        ${isPreviewOnly ? html`<div class="file-viewer-preview-pill">Preview</div>` : null}
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
          ? !isImageFile && !isAudioFile && !isSqliteFile
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
              <div class="file-viewer-protected-banner-text">Viewing unsynced changes</div>
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
                This file is managed by AlphaClaw and cannot be edited.
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
                onclick=${() => setFrontmatterCollapsed((collapsed) => !collapsed)}
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
                        const formattedValue = formatFrontmatterValue(entry.rawValue);
                        const isMultilineValue = formattedValue.includes("\n");
                        return html`
                          <div class="frontmatter-row" key=${entry.key}>
                            <div class="frontmatter-key">${entry.key}</div>
                            ${isMultilineValue
                              ? html`
                                  <pre class="frontmatter-value frontmatter-value-pre">
${formattedValue}</pre
                                  >
                                `
                              : html`<div class="frontmatter-value">${formattedValue}</div>`}
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
          ? html`<div class="file-viewer-state file-viewer-state-error">${error}</div>`
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
                          <div class="file-viewer-state">Could not render image preview.</div>
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
                            <div class="file-viewer-state">Could not render audio preview.</div>
                          `}
                    </div>
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
                                  <div class="file-viewer-state file-viewer-state-error">
                                    ${diffError}
                                  </div>
                                `
                              : html`
                                  <pre class="file-viewer-diff-pre">
${(diffContent || "").split("\n").map((line, lineIndex) => {
                                    const lineClass =
                                      line.startsWith("+") && !line.startsWith("+++")
                                        ? "is-added"
                                        : line.startsWith("-") && !line.startsWith("---")
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
                                aria-hidden=${viewMode === "preview" ? "false" : "true"}
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
                                          editorLineNumberRowRefs.current[lineNumber - 1] = element;
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
                                            editorHighlightLineRefs.current[line.lineNumber - 1] =
                                              element;
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
                                          editorLineNumberRowRefs.current[lineNumber - 1] = element;
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
