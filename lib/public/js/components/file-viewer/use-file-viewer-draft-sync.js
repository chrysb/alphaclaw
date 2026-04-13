import { useEffect } from "preact/hooks";
import {
  clearStoredFileDraft,
  updateDraftIndex,
  writeStoredFileDraft,
} from "../../lib/browse-draft-state.js";

export const useFileViewerDraftSync = ({
  loadedFilePathRef,
  normalizedPath,
  canEditFile,
  hasSelectedPath,
  loading,
  content,
  initialContent,
}) => {
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
};
