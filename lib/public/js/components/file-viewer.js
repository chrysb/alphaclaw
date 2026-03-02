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
import { fetchFileContent, saveFileContent } from "../lib/api.js";
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
import { SaveFillIcon } from "./icons.js";
import { showToast } from "./toast.js";

const html = htm.bind(h);
const kFileViewerModeStorageKey = "alphaclaw.browse.fileViewerMode";
const kLegacyFileViewerModeStorageKey = "alphaclawBrowseFileViewerMode";
const kProtectedBrowsePaths = new Set(["openclaw.json", "devices/paired.json"]);
const kLoadingIndicatorDelayMs = 1000;

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


export const FileViewer = ({ filePath = "" }) => {
  const normalizedPath = String(filePath || "").trim();
  const normalizedPolicyPath = normalizePolicyPath(normalizedPath);
  const [content, setContent] = useState("");
  const [initialContent, setInitialContent] = useState("");
  const [viewMode, setViewMode] = useState(readStoredFileViewerMode);
  const [loading, setLoading] = useState(false);
  const [showDelayedLoadingSpinner, setShowDelayedLoadingSpinner] =
    useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [isFolderPath, setIsFolderPath] = useState(false);
  const [frontmatterCollapsed, setFrontmatterCollapsed] = useState(false);
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
  const editorLineNumberRowRefs = useRef([]);
  const editorHighlightLineRefs = useRef([]);

  const pathSegments = useMemo(
    () => parsePathSegments(normalizedPath),
    [normalizedPath],
  );
  const hasSelectedPath = normalizedPath.length > 0;
  const canEditFile = hasSelectedPath && !isFolderPath;
  const isDirty = canEditFile && content !== initialContent;
  const isProtectedFile =
    canEditFile && kProtectedBrowsePaths.has(normalizedPolicyPath);
  const isProtectedLocked =
    isProtectedFile && !protectedEditBypassPaths.has(normalizedPolicyPath);
  const syntaxKind = useMemo(
    () => getFileSyntaxKind(normalizedPath),
    [normalizedPath],
  );
  const isMarkdownFile = syntaxKind === "markdown";
  const shouldUseHighlightedEditor = syntaxKind !== "plain";
  const parsedFrontmatter = useMemo(
    () =>
      isMarkdownFile
        ? parseFrontmatter(content)
        : { entries: [], body: content },
    [content, isMarkdownFile],
  );
  const highlightedEditorLines = useMemo(
    () =>
      shouldUseHighlightedEditor
        ? highlightEditorLines(content, syntaxKind)
        : [],
    [content, shouldUseHighlightedEditor, syntaxKind],
  );
  const editorLineNumbers = useMemo(() => {
    const lineCount = String(content || "").split("\n").length;
    return Array.from({ length: lineCount }, (_, index) => index + 1);
  }, [content]);

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
    if (!hasSelectedPath) {
      setContent("");
      setInitialContent("");
      setError("");
      setIsFolderPath(false);
      viewScrollRatioRef.current = 0;
      loadedFilePathRef.current = "";
      return () => {
        active = false;
      };
    }

    const loadFile = async () => {
      setLoading(true);
      setError("");
      setIsFolderPath(false);
      try {
        const data = await fetchFileContent(normalizedPath);
        if (!active) return;
        const nextContent = data.content || "";
        const draftContent = readStoredFileDraft(normalizedPath);
        setContent(draftContent || nextContent);
        updateDraftIndex(
          normalizedPath,
          Boolean(draftContent && draftContent !== nextContent),
          { dispatchEvent: (event) => window.dispatchEvent(event) },
        );
        setInitialContent(nextContent);
        viewScrollRatioRef.current = 0;
        loadedFilePathRef.current = normalizedPath;
      } catch (loadError) {
        if (!active) return;
        const message = loadError.message || "Could not load file";
        if (/path is not a file/i.test(message)) {
          setContent("");
          setInitialContent("");
          setIsFolderPath(true);
          setError("");
          loadedFilePathRef.current = normalizedPath;
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

  const handleSave = async () => {
    if (!canEditFile || saving || !isDirty || isProtectedLocked) return;
    setSaving(true);
    setError("");
    try {
      const data = await saveFileContent(normalizedPath, content);
      setInitialContent(content);
      clearStoredFileDraft(normalizedPath);
      updateDraftIndex(normalizedPath, false, {
        dispatchEvent: (event) => window.dispatchEvent(event),
      });
      window.dispatchEvent(
        new CustomEvent("alphaclaw:browse-file-saved", {
          detail: { path: normalizedPath },
        }),
      );
      if (data.synced === false) {
        showToast("Saved, but git sync failed", "error");
      } else {
        showToast("Saved and synced", "success");
      }
    } catch (saveError) {
      const message = saveError.message || "Could not save file";
      setError(message);
      showToast(message, "error");
    } finally {
      setSaving(false);
    }
  };

  const handleEditProtectedFile = () => {
    if (!normalizedPolicyPath) return;
    setProtectedEditBypassPaths((previousPaths) => {
      const nextPaths = new Set(previousPaths);
      nextPaths.add(normalizedPolicyPath);
      return nextPaths;
    });
  };

  const handleContentInput = (event) => {
    if (isProtectedLocked) return;
    const nextContent = event.target.value;
    setContent(nextContent);
    if (hasSelectedPath && canEditFile) {
      writeStoredFileDraft(normalizedPath, nextContent);
      updateDraftIndex(normalizedPath, nextContent !== initialContent, {
        dispatchEvent: (event) => window.dispatchEvent(event),
      });
    }
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
        ${isMarkdownFile &&
        html`
          <div class="file-viewer-view-toggle">
            <button
              class=${`file-viewer-view-toggle-button ${viewMode === "edit" ? "active" : ""}`}
              onclick=${() => handleChangeViewMode("edit")}
            >
              edit
            </button>
            <button
              class=${`file-viewer-view-toggle-button ${viewMode === "preview" ? "active" : ""}`}
              onclick=${() => handleChangeViewMode("preview")}
            >
              preview
            </button>
          </div>
        `}
        <${ActionButton}
          onClick=${handleSave}
          disabled=${loading || !isDirty || !canEditFile || isProtectedLocked}
          loading=${saving}
          tone=${isDirty ? "primary" : "secondary"}
          size="sm"
          idleLabel="Save"
          loadingLabel="Saving..."
          idleIcon=${SaveFillIcon}
          idleIconClassName="file-viewer-save-icon"
          className="file-viewer-save-action"
        />
      </div>
      ${isProtectedFile
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
                            value=${content}
                            onInput=${handleContentInput}
                            onScroll=${handleEditorScroll}
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
                                  value=${content}
                                  onInput=${handleContentInput}
                                  onScroll=${handleEditorScroll}
                                  readonly=${isProtectedLocked}
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
                                value=${content}
                                onInput=${handleContentInput}
                                onScroll=${handleEditorScroll}
                                readonly=${isProtectedLocked}
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
