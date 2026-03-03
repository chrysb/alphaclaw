import { useEffect } from "https://esm.sh/preact/hooks";
import { readStoredEditorSelection } from "./storage.js";
import { clampSelectionIndex } from "./utils.js";
import { getScrollRatio } from "./scroll-sync.js";

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
  editorTextareaRef,
  editorLineNumbersRef,
  editorHighlightRef,
  viewScrollRatioRef,
}) => {
  useEffect(() => {
    if (isEditBlocked) {
      restoredSelectionPathRef.current = "";
      return () => {};
    }
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
  }, [
    canEditFile,
    isEditBlocked,
    loading,
    hasSelectedPath,
    normalizedPath,
    content,
    viewMode,
    loadedFilePathRef,
    restoredSelectionPathRef,
    editorTextareaRef,
    editorLineNumbersRef,
    editorHighlightRef,
    viewScrollRatioRef,
  ]);
};
