import { useEffect, useRef } from "https://esm.sh/preact/hooks";
import { readStoredEditorSelection } from "./storage.js";
import { clampSelectionIndex } from "./utils.js";
import { getScrollRatio } from "./scroll-sync.js";

const getCharOffsetForLine = (text, lineNumber) => {
  const lines = String(text || "").split("\n");
  const targetIndex = Math.max(0, Math.min(lineNumber - 1, lines.length - 1));
  let offset = 0;
  for (let i = 0; i < targetIndex; i += 1) offset += lines[i].length + 1;
  return offset;
};

const scrollEditorToLine = ({
  lineIndex,
  textareaElement,
  editorLineNumbersRef,
  editorHighlightRef,
  viewScrollRatioRef,
}) => {
  const computedStyle = window.getComputedStyle(textareaElement);
  const parsedLineHeight = Number.parseFloat(computedStyle.lineHeight || "");
  const lineHeight =
    Number.isFinite(parsedLineHeight) && parsedLineHeight > 0 ? parsedLineHeight : 20;
  const nextScrollTop = Math.max(
    0,
    lineIndex * lineHeight - textareaElement.clientHeight * 0.4,
  );
  textareaElement.scrollTop = nextScrollTop;
  if (editorLineNumbersRef.current) {
    editorLineNumbersRef.current.scrollTop = nextScrollTop;
  }
  if (editorHighlightRef.current) {
    editorHighlightRef.current.scrollTop = nextScrollTop;
  }
  viewScrollRatioRef.current = getScrollRatio(textareaElement);
};

const clearLineHighlights = (lineNumbersContainer) => {
  if (!lineNumbersContainer) return;
  const highlighted = lineNumbersContainer.querySelectorAll(".line-highlight-flash");
  for (const row of highlighted) row.classList.remove("line-highlight-flash");
};

const highlightLineRange = (lineNumbersContainer, startIndex, endIndex) => {
  if (!lineNumbersContainer) return;
  clearLineHighlights(lineNumbersContainer);
  const rows = lineNumbersContainer.querySelectorAll("[data-line-row]");
  const safeEnd = Math.min(endIndex, rows.length - 1);
  for (let i = startIndex; i <= safeEnd; i += 1) {
    const row = rows[i];
    if (row) row.classList.add("line-highlight-flash");
  }
};

export const useEditorSelectionRestore = ({
  canEditFile,
  isEditBlocked,
  loading,
  hasSelectedPath,
  normalizedPath,
  loadedFilePathRef,
  restoredSelectionPathRef,
  viewMode,
  content,
  lineTarget = 0,
  lineEndTarget = 0,
  editorTextareaRef,
  editorLineNumbersRef,
  editorHighlightRef,
  viewScrollRatioRef,
}) => {
  const appliedLineTargetRef = useRef("");

  useEffect(() => {
    if (lineTarget && lineTarget >= 1) return;
    if (!appliedLineTargetRef.current) return;
    clearLineHighlights(editorLineNumbersRef.current);
    appliedLineTargetRef.current = "";
  }, [lineTarget, normalizedPath, editorLineNumbersRef]);

  useEffect(() => {
    if (isEditBlocked || !canEditFile || loading || !hasSelectedPath) return () => {};
    if (loadedFilePathRef.current !== normalizedPath) return () => {};
    if (viewMode !== "edit") return () => {};
    if (!lineTarget || lineTarget < 1) return () => {};
    const effectiveEnd = lineEndTarget && lineEndTarget >= lineTarget ? lineEndTarget : lineTarget;
    const lineKey = `${normalizedPath}:${lineTarget}-${effectiveEnd}`;
    if (appliedLineTargetRef.current === lineKey) return () => {};
    let frameId = 0;
    let attempts = 0;
    const applyLineTarget = () => {
      const textareaElement = editorTextareaRef.current;
      if (!textareaElement) {
        attempts += 1;
        if (attempts < 6) frameId = window.requestAnimationFrame(applyLineTarget);
        return;
      }
      const safeContent = String(content || "");
      const charOffset = getCharOffsetForLine(safeContent, lineTarget);
      textareaElement.setSelectionRange(charOffset, charOffset);
      const startIndex = lineTarget - 1;
      const endIndex = effectiveEnd - 1;
      window.requestAnimationFrame(() => {
        const nextTextareaElement = editorTextareaRef.current;
        if (!nextTextareaElement) return;
        scrollEditorToLine({
          lineIndex: startIndex,
          textareaElement: nextTextareaElement,
          editorLineNumbersRef,
          editorHighlightRef,
          viewScrollRatioRef,
        });
        highlightLineRange(editorLineNumbersRef.current, startIndex, endIndex);
      });
      appliedLineTargetRef.current = lineKey;
      restoredSelectionPathRef.current = normalizedPath;
    };
    frameId = window.requestAnimationFrame(applyLineTarget);
    return () => {
      if (frameId) window.cancelAnimationFrame(frameId);
    };
  }, [
    canEditFile,
    isEditBlocked,
    loading,
    hasSelectedPath,
    normalizedPath,
    content,
    viewMode,
    lineTarget,
    lineEndTarget,
    loadedFilePathRef,
    restoredSelectionPathRef,
    editorTextareaRef,
    editorLineNumbersRef,
    editorHighlightRef,
    viewScrollRatioRef,
  ]);

  useEffect(() => {
    if (isEditBlocked) {
      restoredSelectionPathRef.current = "";
      return () => {};
    }
    if (!canEditFile || loading || !hasSelectedPath) return () => {};
    if (loadedFilePathRef.current !== normalizedPath) return () => {};
    if (restoredSelectionPathRef.current === normalizedPath) return () => {};
    if (viewMode !== "edit") return () => {};
    if (lineTarget && lineTarget >= 1) return () => {};
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
        scrollEditorToLine({
          lineIndex,
          textareaElement: nextTextareaElement,
          editorLineNumbersRef,
          editorHighlightRef,
          viewScrollRatioRef,
        });
      });
      restoredSelectionPathRef.current = normalizedPath;
    };
    frameId = window.requestAnimationFrame(restoreSelection);
    return () => {
      if (frameId) window.cancelAnimationFrame(frameId);
    };
  }, [
    canEditFile,
    isEditBlocked,
    loading,
    hasSelectedPath,
    normalizedPath,
    content,
    viewMode,
    lineTarget,
    loadedFilePathRef,
    restoredSelectionPathRef,
    editorTextareaRef,
    editorLineNumbersRef,
    editorHighlightRef,
    viewScrollRatioRef,
  ]);
};
