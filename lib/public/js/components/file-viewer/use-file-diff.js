import { useEffect, useState } from "https://esm.sh/preact/hooks";
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

  return {
    diffLoading,
    diffError,
    diffContent,
  };
};
