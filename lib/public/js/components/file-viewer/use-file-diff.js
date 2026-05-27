import { useEffect, useState } from "preact/hooks";
import { fetchBrowseFileDiff } from "../../lib/api.js";

export const useFileDiff = ({
  hasSelectedPath,
  isDiffView,
  isPreviewOnly,
  normalizedPath,
}) => {
  const [diffLoading, setDiffLoading] = useState(false);
  const [diffError, setDiffError] = useState("");
  const [diffContent, setDiffContent] = useState("");
  const [diffStatus, setDiffStatus] = useState({
    statusKind: "",
    isDeleted: false,
  });

  useEffect(() => {
    let active = true;
    if (!hasSelectedPath || !isDiffView || isPreviewOnly) {
      setDiffLoading(false);
      setDiffError("");
      setDiffContent("");
      setDiffStatus({ statusKind: "", isDeleted: false });
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
        setDiffStatus({
          statusKind: String(data?.statusKind || ""),
          isDeleted: !!data?.isDeleted,
        });
      } catch (nextError) {
        if (!active) return;
        setDiffError(nextError.message || "Could not load diff");
        setDiffStatus({ statusKind: "", isDeleted: false });
      } finally {
        if (active) setDiffLoading(false);
      }
    };
    loadDiff();
    return () => {
      active = false;
    };
  }, [hasSelectedPath, isDiffView, isPreviewOnly, normalizedPath]);

  return {
    diffLoading,
    diffError,
    diffContent,
    diffStatus,
  };
};
