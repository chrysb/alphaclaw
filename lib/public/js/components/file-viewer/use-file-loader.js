import { useEffect, useRef } from "preact/hooks";
import { fetchBrowseSqliteTable, fetchFileContent } from "../../lib/api.js";
import {
  clearStoredFileDraft,
  readStoredFileDraft,
  updateDraftIndex,
} from "../../lib/browse-draft-state.js";
import { showToast } from "../toast.js";
import { kFileRefreshIntervalMs, kSqlitePageSize } from "./constants.js";

export const useFileLoader = ({
  hasSelectedPath,
  normalizedPath,
  isDiffView,
  isSqliteFile,
  sqliteSelectedTable,
  sqliteTableOffset,
  canEditFile,
  isFolderPath,
  loading,
  saving,
  initialContent,
  isDirty,
  setContent,
  setInitialContent,
  setFileKind,
  setImageDataUrl,
  setAudioDataUrl,
  setSqliteSummary,
  setSqliteSelectedTable,
  setSqliteTableOffset,
  setSqliteTableLoading,
  setSqliteTableError,
  setSqliteTableData,
  setError,
  setIsFolderPath,
  setExternalChangeNoticeShown,
  externalChangeNoticeShown,
  viewScrollRatioRef,
  setLoading,
}) => {
  const loadedFilePathRef = useRef("");
  const restoredSelectionPathRef = useRef("");
  const fileRefreshInFlightRef = useRef(false);

  useEffect(() => {
    let active = true;
    loadedFilePathRef.current = "";
    restoredSelectionPathRef.current = "";
    if (!hasSelectedPath) {
      setContent("");
      setInitialContent("");
      setFileKind("text");
      setImageDataUrl("");
      setAudioDataUrl("");
      setSqliteSummary(null);
      setSqliteSelectedTable("");
      setSqliteTableOffset(0);
      setSqliteTableLoading(false);
      setSqliteTableError("");
      setSqliteTableData(null);
      setError("");
      setIsFolderPath(false);
      viewScrollRatioRef.current = 0;
      loadedFilePathRef.current = "";
      return () => {
        active = false;
      };
    }
    // Clear previous file state immediately so large content from the last
    // file is never rendered/parses under the next file's syntax mode.
    setContent("");
    setInitialContent("");
    setImageDataUrl("");
    setAudioDataUrl("");
    setSqliteSummary(null);
    setSqliteSelectedTable("");
    setSqliteTableOffset(0);
    setSqliteTableLoading(false);
    setSqliteTableError("");
    setSqliteTableData(null);
    setFileKind("text");
    setError("");
    setIsFolderPath(false);
    setExternalChangeNoticeShown(false);
    viewScrollRatioRef.current = 0;
    if (isDiffView) {
      setLoading(false);
      loadedFilePathRef.current = normalizedPath;
      restoredSelectionPathRef.current = "";
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
        const nextFileKind =
          data?.kind === "image"
            ? "image"
            : data?.kind === "audio"
              ? "audio"
              : data?.kind === "sqlite"
                ? "sqlite"
                : "text";
        setFileKind(nextFileKind);
        if (nextFileKind === "image") {
          setImageDataUrl(String(data?.imageDataUrl || ""));
          setAudioDataUrl("");
          setSqliteSummary(null);
          setSqliteSelectedTable("");
          setSqliteTableOffset(0);
          setSqliteTableLoading(false);
          setSqliteTableError("");
          setSqliteTableData(null);
          setContent("");
          setInitialContent("");
          setExternalChangeNoticeShown(false);
          viewScrollRatioRef.current = 0;
          loadedFilePathRef.current = normalizedPath;
          restoredSelectionPathRef.current = "";
          return;
        }
        if (nextFileKind === "audio") {
          setAudioDataUrl(String(data?.audioDataUrl || ""));
          setImageDataUrl("");
          setSqliteSummary(null);
          setSqliteSelectedTable("");
          setSqliteTableOffset(0);
          setSqliteTableLoading(false);
          setSqliteTableError("");
          setSqliteTableData(null);
          setContent("");
          setInitialContent("");
          setExternalChangeNoticeShown(false);
          viewScrollRatioRef.current = 0;
          loadedFilePathRef.current = normalizedPath;
          restoredSelectionPathRef.current = "";
          return;
        }
        if (nextFileKind === "sqlite") {
          const nextSqliteSummary = data?.sqliteSummary || null;
          const nextObjects = nextSqliteSummary?.objects || [];
          const defaultTable =
            nextObjects.find((entry) => entry?.type === "table")?.name ||
            nextObjects[0]?.name ||
            "";
          setSqliteSummary(nextSqliteSummary);
          setSqliteSelectedTable(defaultTable);
          setSqliteTableOffset(0);
          setSqliteTableLoading(false);
          setSqliteTableError("");
          setSqliteTableData(null);
          setImageDataUrl("");
          setAudioDataUrl("");
          setContent("");
          setInitialContent("");
          setExternalChangeNoticeShown(false);
          viewScrollRatioRef.current = 0;
          loadedFilePathRef.current = normalizedPath;
          restoredSelectionPathRef.current = "";
          return;
        }
        setImageDataUrl("");
        setAudioDataUrl("");
        setSqliteSummary(null);
        setSqliteSelectedTable("");
        setSqliteTableOffset(0);
        setSqliteTableLoading(false);
        setSqliteTableError("");
        setSqliteTableData(null);
        const nextContent = data.content || "";
        const draftContent = readStoredFileDraft(normalizedPath);
        setContent(draftContent || nextContent);
        updateDraftIndex(normalizedPath, Boolean(draftContent && draftContent !== nextContent), {
          dispatchEvent: (event) => window.dispatchEvent(event),
        });
        setInitialContent(nextContent);
        setExternalChangeNoticeShown(false);
        viewScrollRatioRef.current = 0;
        loadedFilePathRef.current = normalizedPath;
        restoredSelectionPathRef.current = "";
      } catch (loadError) {
        if (!active) return;
        setFileKind("text");
        setImageDataUrl("");
        setAudioDataUrl("");
        setSqliteSummary(null);
        setSqliteSelectedTable("");
        setSqliteTableOffset(0);
        setSqliteTableLoading(false);
        setSqliteTableError("");
        setSqliteTableData(null);
        const message = loadError.message || "Could not load file";
        if (/path is not a file/i.test(message)) {
          setContent("");
          setInitialContent("");
          setIsFolderPath(true);
          setError("");
          loadedFilePathRef.current = normalizedPath;
          restoredSelectionPathRef.current = "";
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
  }, [hasSelectedPath, normalizedPath, isDiffView]);

  useEffect(() => {
    if (!isSqliteFile || !normalizedPath || !sqliteSelectedTable) {
      setSqliteTableData(null);
      setSqliteTableError("");
      setSqliteTableLoading(false);
      return () => {};
    }
    let active = true;
    const loadSqliteTable = async () => {
      setSqliteTableLoading(true);
      setSqliteTableError("");
      try {
        const tableData = await fetchBrowseSqliteTable({
          filePath: normalizedPath,
          table: sqliteSelectedTable,
          limit: kSqlitePageSize,
          offset: sqliteTableOffset,
        });
        if (!active) return;
        setSqliteTableData(tableData);
      } catch (nextError) {
        if (!active) return;
        setSqliteTableError(nextError.message || "Could not load sqlite table");
      } finally {
        if (active) setSqliteTableLoading(false);
      }
    };
    loadSqliteTable();
    return () => {
      active = false;
    };
  }, [isSqliteFile, normalizedPath, sqliteSelectedTable, sqliteTableOffset]);

  useEffect(() => {
    if (!hasSelectedPath || isFolderPath || !canEditFile || isDiffView) return () => {};
    const refreshFromDisk = async () => {
      if (loading || saving) return;
      if (fileRefreshInFlightRef.current) return;
      fileRefreshInFlightRef.current = true;
      try {
        const data = await fetchFileContent(normalizedPath);
        const diskContent = data.content || "";
        if (diskContent === initialContent) {
          setExternalChangeNoticeShown(false);
          return;
        }
        // Auto-refresh only when editor has no unsaved work.
        if (!isDirty) {
          setContent(diskContent);
          setInitialContent(diskContent);
          clearStoredFileDraft(normalizedPath);
          updateDraftIndex(normalizedPath, false, {
            dispatchEvent: (event) => window.dispatchEvent(event),
          });
          setExternalChangeNoticeShown(false);
          window.dispatchEvent(new CustomEvent("alphaclaw:browse-tree-refresh"));
          return;
        }
        if (!externalChangeNoticeShown) {
          showToast(
            "This file changed on disk. Save to overwrite or reload by re-opening.",
            "error",
          );
          setExternalChangeNoticeShown(true);
        }
      } catch {
        // Ignore transient refresh errors to avoid interrupting editing.
      } finally {
        fileRefreshInFlightRef.current = false;
      }
    };
    const intervalId = window.setInterval(refreshFromDisk, kFileRefreshIntervalMs);
    return () => {
      window.clearInterval(intervalId);
    };
  }, [
    hasSelectedPath,
    isFolderPath,
    canEditFile,
    isDiffView,
    loading,
    saving,
    normalizedPath,
    initialContent,
    isDirty,
    externalChangeNoticeShown,
  ]);

  return {
    loadedFilePathRef,
    restoredSelectionPathRef,
  };
};
