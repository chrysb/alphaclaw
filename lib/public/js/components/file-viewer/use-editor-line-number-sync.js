import { useCallback, useEffect } from "https://esm.sh/preact/hooks";

export const useEditorLineNumberSync = ({
  enabled = false,
  syncKey = "",
  editorLineNumberRowRefs,
  editorHighlightLineRefs,
}) => {
  const syncEditorLineNumberHeights = useCallback(() => {
    if (!enabled) return;
    const numberRows = editorLineNumberRowRefs?.current || [];
    const highlightRows = editorHighlightLineRefs?.current || [];
    const rowCount = Math.min(numberRows.length, highlightRows.length);
    for (let index = 0; index < rowCount; index += 1) {
      const numberRow = numberRows[index];
      const highlightRow = highlightRows[index];
      if (!numberRow || !highlightRow) continue;
      numberRow.style.height = `${highlightRow.offsetHeight}px`;
    }
  }, [editorHighlightLineRefs, editorLineNumberRowRefs, enabled]);

  useEffect(() => {
    syncEditorLineNumberHeights();
  }, [syncEditorLineNumberHeights, syncKey]);

  useEffect(() => {
    if (!enabled) return () => {};
    const onResize = () => syncEditorLineNumberHeights();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [enabled, syncEditorLineNumberHeights]);

  return {
    syncEditorLineNumberHeights,
  };
};
