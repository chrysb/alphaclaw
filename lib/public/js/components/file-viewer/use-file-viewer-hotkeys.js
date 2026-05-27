import { useEffect } from "preact/hooks";

export const useFileViewerHotkeys = ({
  canEditFile,
  isPreviewOnly,
  isDiffView,
  viewMode,
  handleSave,
}) => {
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
};
