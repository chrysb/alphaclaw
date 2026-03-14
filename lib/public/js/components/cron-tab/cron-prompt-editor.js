import { h } from "https://esm.sh/preact";
import { useEffect, useMemo, useRef, useState } from "https://esm.sh/preact/hooks";
import htm from "https://esm.sh/htm";
import { EditorSurface } from "../file-viewer/editor-surface.js";
import { countTextLines, shouldUseSimpleEditorMode } from "../file-viewer/utils.js";
import {
  kLargeFileSimpleEditorCharThreshold,
  kLargeFileSimpleEditorLineThreshold,
} from "../file-viewer/constants.js";
import { useEditorLineNumberSync } from "../file-viewer/use-editor-line-number-sync.js";
import { highlightEditorLines } from "../../lib/syntax-highlighters/index.js";
import { readUiSettings, writeUiSettings } from "../../lib/ui-settings.js";

const html = htm.bind(h);
const kCronPromptEditorHeightUiSettingKey = "cronPromptEditorHeightPx";
const kCronPromptEditorDefaultHeightPx = 280;
const kCronPromptEditorMinHeightPx = 180;

const clampPromptEditorHeight = (value) => {
  const parsed = Number(value);
  const normalized = Number.isFinite(parsed)
    ? Math.round(parsed)
    : kCronPromptEditorDefaultHeightPx;
  return Math.max(kCronPromptEditorMinHeightPx, normalized);
};

const readCssHeightPx = (element) => {
  if (!element) return 0;
  const computedHeight = Number.parseFloat(
    window.getComputedStyle(element).height || "0",
  );
  return Number.isFinite(computedHeight) ? computedHeight : 0;
};

export const CronPromptEditor = ({
  promptValue = "",
  savedPromptValue = "",
  onChangePrompt = () => {},
  onSaveChanges = () => {},
}) => {
  const promptEditorShellRef = useRef(null);
  const editorTextareaRef = useRef(null);
  const editorLineNumbersRef = useRef(null);
  const editorLineNumberRowRefs = useRef([]);
  const editorHighlightRef = useRef(null);
  const editorHighlightLineRefs = useRef([]);
  const [promptEditorHeightPx, setPromptEditorHeightPx] = useState(() => {
    const settings = readUiSettings();
    return clampPromptEditorHeight(
      settings?.[kCronPromptEditorHeightUiSettingKey],
    );
  });

  const lineCount = countTextLines(promptValue);
  const shouldUseHighlightedEditor = !shouldUseSimpleEditorMode({
    contentLength: promptValue.length,
    lineCount,
    charThreshold: kLargeFileSimpleEditorCharThreshold,
    lineThreshold: kLargeFileSimpleEditorLineThreshold,
  });
  const highlightedEditorLines = useMemo(
    () =>
      shouldUseHighlightedEditor
        ? highlightEditorLines(promptValue, "markdown")
        : [],
    [promptValue, shouldUseHighlightedEditor],
  );
  const editorLineCount = Math.max(
    lineCount,
    Array.isArray(highlightedEditorLines) ? highlightedEditorLines.length : 0,
  );
  const editorLineNumbers = useMemo(
    () => Array.from({ length: editorLineCount }, (_, index) => index + 1),
    [editorLineCount],
  );
  const isDirty = promptValue !== savedPromptValue;

  useEditorLineNumberSync({
    enabled: shouldUseHighlightedEditor,
    syncKey: `${promptValue.length}:${highlightedEditorLines.length}`,
    editorLineNumberRowRefs,
    editorHighlightLineRefs,
  });

  const handleEditorScroll = (event) => {
    const scrollTop = event.currentTarget.scrollTop;
    if (editorLineNumbersRef.current)
      editorLineNumbersRef.current.scrollTop = scrollTop;
    if (editorHighlightRef.current) {
      editorHighlightRef.current.scrollTop = scrollTop;
    }
  };

  const handleEditorKeyDown = (event) => {
    if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "s") {
      event.preventDefault();
      onSaveChanges();
    }
    if (event.key === "Tab") {
      event.preventDefault();
      const textarea = editorTextareaRef.current;
      if (!textarea) return;
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const nextValue = `${promptValue.slice(0, start)}  ${promptValue.slice(end)}`;
      onChangePrompt(nextValue);
      window.requestAnimationFrame(() => {
        textarea.selectionStart = start + 2;
        textarea.selectionEnd = start + 2;
      });
    }
  };

  useEffect(() => {
    const shellElement = promptEditorShellRef.current;
    if (!shellElement || typeof ResizeObserver === "undefined") return () => {};

    let saveTimer = null;
    const observer = new ResizeObserver((entries) => {
      const entry = entries?.[0];
      const nextHeight = clampPromptEditorHeight(readCssHeightPx(entry?.target));
      setPromptEditorHeightPx((currentValue) =>
        Math.abs(currentValue - nextHeight) >= 1 ? nextHeight : currentValue,
      );
      if (saveTimer) window.clearTimeout(saveTimer);
      saveTimer = window.setTimeout(() => {
        const settings = readUiSettings();
        settings[kCronPromptEditorHeightUiSettingKey] = nextHeight;
        writeUiSettings(settings);
      }, 120);
    });
    observer.observe(shellElement);
    return () => {
      observer.disconnect();
      if (saveTimer) window.clearTimeout(saveTimer);
    };
  }, []);

  return html`
    <section class="bg-surface border border-border rounded-xl p-4 space-y-3">
      <div class="flex items-center justify-between gap-2">
        <h3 class="card-label card-label-bright inline-flex items-center gap-1.5">
          Prompt
          ${isDirty ? html`<span class="file-viewer-dirty-dot"></span>` : null}
        </h3>
      </div>
      <div
        class="cron-prompt-editor-shell"
        ref=${promptEditorShellRef}
        style=${{ height: `${promptEditorHeightPx}px` }}
      >
        <${EditorSurface}
          editorShellClassName="file-viewer-editor-shell"
          editorLineNumbers=${editorLineNumbers}
          editorLineNumbersRef=${editorLineNumbersRef}
          editorLineNumberRowRefs=${editorLineNumberRowRefs}
          shouldUseHighlightedEditor=${shouldUseHighlightedEditor}
          highlightedEditorLines=${highlightedEditorLines}
          editorHighlightRef=${editorHighlightRef}
          editorHighlightLineRefs=${editorHighlightLineRefs}
          editorTextareaRef=${editorTextareaRef}
          renderContent=${promptValue}
          handleContentInput=${(event) => onChangePrompt(event.target.value)}
          handleEditorKeyDown=${handleEditorKeyDown}
          handleEditorScroll=${handleEditorScroll}
          handleEditorSelectionChange=${() => {}}
          isEditBlocked=${false}
          isPreviewOnly=${false}
        />
      </div>
    </section>
  `;
};
