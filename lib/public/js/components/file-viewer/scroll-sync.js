import { useRef } from "preact/hooks";

export const getScrollRatio = (element) => {
  if (!element) return 0;
  const maxScrollTop = element.scrollHeight - element.clientHeight;
  if (maxScrollTop <= 0) return 0;
  return element.scrollTop / maxScrollTop;
};

export const setScrollByRatio = (element, ratio) => {
  if (!element) return;
  const maxScrollTop = element.scrollHeight - element.clientHeight;
  if (maxScrollTop <= 0) {
    element.scrollTop = 0;
    return;
  }
  const clampedRatio = Math.max(0, Math.min(1, ratio));
  element.scrollTop = maxScrollTop * clampedRatio;
};

export const useScrollSync = ({
  viewMode,
  setViewMode,
  previewRef,
  editorTextareaRef,
  editorLineNumbersRef,
  editorHighlightRef,
}) => {
  const viewScrollRatioRef = useRef(0);
  const isSyncingScrollRef = useRef(false);

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

  return {
    viewScrollRatioRef,
    isSyncingScrollRef,
    handleEditorScroll,
    handlePreviewScroll,
    handleChangeViewMode,
  };
};
