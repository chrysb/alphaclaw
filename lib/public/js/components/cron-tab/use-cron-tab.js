import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "https://esm.sh/preact/hooks";
import { usePolling } from "../../hooks/usePolling.js";
import {
  fetchCronJobRuns,
  fetchCronJobs,
  fetchCronJobUsage,
  fetchCronStatus,
  setCronJobEnabled,
  triggerCronJobRun,
  updateCronJobPrompt,
} from "../../lib/api.js";
import { readUiSettings, writeUiSettings } from "../../lib/ui-settings.js";
import { showToast } from "../toast.js";
import { kAllCronJobsRouteKey } from "./cron-helpers.js";

const kDefaultListPanelWidthPx = 372;
const kListPanelMinWidthPx = 220;
const kListPanelMaxWidthPx = 480;
const kListPanelWidthUiSettingKey = "cronListPanelWidthPx";
const kRunsPageSize = 25;

const clampListPanelWidth = (value) =>
  Math.max(kListPanelMinWidthPx, Math.min(kListPanelMaxWidthPx, value));

const normalizeRouteJobId = (jobId = "") => {
  const normalized = String(jobId || "").trim();
  return normalized || kAllCronJobsRouteKey;
};

export const useCronTab = ({ jobId = "", onSetLocation = () => {} } = {}) => {
  const listPanelRef = useRef(null);
  const [listPanelWidthPx, setListPanelWidthPx] = useState(() => {
    const settings = readUiSettings();
    if (!Number.isFinite(settings?.[kListPanelWidthUiSettingKey])) {
      return kDefaultListPanelWidthPx;
    }
    return clampListPanelWidth(settings[kListPanelWidthUiSettingKey]);
  });
  const [isResizingListPanel, setIsResizingListPanel] = useState(false);
  const [runStatusFilter, setRunStatusFilter] = useState("all");
  const [runDeliveryFilter, setRunDeliveryFilter] = useState("all");
  const [runEntries, setRunEntries] = useState([]);
  const [runHasMore, setRunHasMore] = useState(false);
  const [runNextOffset, setRunNextOffset] = useState(0);
  const [runTotal, setRunTotal] = useState(0);
  const [loadingMoreRuns, setLoadingMoreRuns] = useState(false);
  const [promptValue, setPromptValue] = useState("");
  const [savedPromptValue, setSavedPromptValue] = useState("");
  const [savingPrompt, setSavingPrompt] = useState(false);
  const [runningJob, setRunningJob] = useState(false);
  const [togglingJobEnabled, setTogglingJobEnabled] = useState(false);
  const [usageDays, setUsageDays] = useState(30);

  const selectedRouteKey = normalizeRouteJobId(jobId);
  const selectedJobId =
    selectedRouteKey === kAllCronJobsRouteKey ? "" : selectedRouteKey;

  const jobsPoll = usePolling(
    () => fetchCronJobs({ sortBy: "nextRunAtMs", sortDir: "asc" }),
    15000,
  );
  const statusPoll = usePolling(fetchCronStatus, 30000);
  const runsPoll = usePolling(
    () => {
      if (!selectedJobId) {
        return Promise.resolve({
          ok: true,
          runs: { entries: [], hasMore: false, nextOffset: 0 },
        });
      }
      return fetchCronJobRuns(selectedJobId, {
        limit: kRunsPageSize,
        offset: 0,
        status: runStatusFilter,
        deliveryStatus: runDeliveryFilter,
        sortDir: "desc",
      });
    },
    10000,
    { enabled: !!selectedJobId },
  );
  const usagePoll = usePolling(
    () => {
      if (!selectedJobId) return Promise.resolve({ ok: true, usage: null });
      return fetchCronJobUsage(selectedJobId, { days: usageDays });
    },
    60000,
    { enabled: !!selectedJobId },
  );

  useEffect(() => {
    const settings = readUiSettings();
    settings[kListPanelWidthUiSettingKey] = listPanelWidthPx;
    writeUiSettings(settings);
  }, [listPanelWidthPx]);

  useEffect(() => {
    if (!runsPoll.data?.runs) return;
    setRunEntries(
      Array.isArray(runsPoll.data.runs.entries)
        ? runsPoll.data.runs.entries
        : [],
    );
    setRunHasMore(!!runsPoll.data.runs.hasMore);
    setRunNextOffset(Number(runsPoll.data.runs.nextOffset || 0));
    setRunTotal(Number(runsPoll.data.runs.total || 0));
  }, [runsPoll.data]);

  const jobs = useMemo(
    () => (Array.isArray(jobsPoll.data?.jobs) ? jobsPoll.data.jobs : []),
    [jobsPoll.data],
  );

  const selectedJob = useMemo(
    () => jobs.find((job) => String(job?.id || "") === selectedJobId) || null,
    [jobs, selectedJobId],
  );

  useEffect(() => {
    if (!selectedJobId) {
      setPromptValue("");
      setSavedPromptValue("");
      return;
    }
    const prompt = String(selectedJob?.payload?.message || "");
    setPromptValue(prompt);
    setSavedPromptValue(prompt);
  }, [selectedJobId, selectedJob?.payload?.message]);

  useEffect(() => {
    setRunEntries([]);
    setRunHasMore(false);
    setRunNextOffset(0);
    setRunTotal(0);
    if (!selectedJobId) return;
    runsPoll.refresh();
  }, [selectedJobId, runStatusFilter, runDeliveryFilter]);

  useEffect(() => {
    if (!selectedJobId) return;
    usagePoll.refresh();
  }, [selectedJobId, usageDays]);

  const resizeListPanelWithClientX = useCallback((clientX) => {
    const listPanelElement = listPanelRef.current;
    if (!listPanelElement) return;
    const parentBounds =
      listPanelElement.parentElement?.getBoundingClientRect();
    if (!parentBounds) return;
    const nextWidth = clampListPanelWidth(
      Math.round(clientX - parentBounds.left),
    );
    setListPanelWidthPx(nextWidth);
  }, []);

  const onListResizerPointerDown = useCallback(
    (event) => {
      event.preventDefault();
      setIsResizingListPanel(true);
      resizeListPanelWithClientX(event.clientX);
    },
    [resizeListPanelWithClientX],
  );

  useEffect(() => {
    if (!isResizingListPanel) return () => {};
    const onPointerMove = (event) => resizeListPanelWithClientX(event.clientX);
    const onPointerUp = () => setIsResizingListPanel(false);
    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);
    const previousUserSelect = document.body.style.userSelect;
    const previousCursor = document.body.style.cursor;
    document.body.style.userSelect = "none";
    document.body.style.cursor = "col-resize";
    return () => {
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
      document.body.style.userSelect = previousUserSelect;
      document.body.style.cursor = previousCursor;
    };
  }, [isResizingListPanel, resizeListPanelWithClientX]);

  const selectAllJobs = useCallback(() => {
    onSetLocation("/cron");
  }, [onSetLocation]);

  const selectJob = useCallback(
    (nextJobId) => {
      onSetLocation(`/cron/${encodeURIComponent(String(nextJobId || ""))}`);
    },
    [onSetLocation],
  );

  const refreshAll = useCallback(() => {
    jobsPoll.refresh();
    statusPoll.refresh();
    runsPoll.refresh();
    usagePoll.refresh();
  }, [
    jobsPoll.refresh,
    runsPoll.refresh,
    statusPoll.refresh,
    usagePoll.refresh,
  ]);

  const runSelectedJobNow = useCallback(async () => {
    if (!selectedJobId || runningJob) return;
    setRunningJob(true);
    try {
      await triggerCronJobRun(selectedJobId);
      showToast("Cron run triggered", "success");
      refreshAll();
    } catch (error) {
      showToast(error.message || "Could not run cron job", "error");
    } finally {
      setRunningJob(false);
    }
  }, [refreshAll, runningJob, selectedJobId]);

  const setSelectedJobEnabled = useCallback(
    async (enabled) => {
      if (!selectedJobId || togglingJobEnabled) return;
      setTogglingJobEnabled(true);
      try {
        await setCronJobEnabled(selectedJobId, enabled);
        showToast(
          enabled ? "Cron job enabled" : "Cron job disabled",
          "success",
        );
        refreshAll();
      } catch (error) {
        showToast(error.message || "Could not update cron job", "error");
      } finally {
        setTogglingJobEnabled(false);
      }
    },
    [refreshAll, selectedJobId, togglingJobEnabled],
  );

  const loadMoreRuns = useCallback(async () => {
    if (!selectedJobId || !runHasMore || loadingMoreRuns) return;
    setLoadingMoreRuns(true);
    try {
      const data = await fetchCronJobRuns(selectedJobId, {
        limit: kRunsPageSize,
        offset: runNextOffset,
        status: runStatusFilter,
        deliveryStatus: runDeliveryFilter,
        sortDir: "desc",
      });
      const nextEntries = Array.isArray(data?.runs?.entries)
        ? data.runs.entries
        : [];
      setRunEntries((currentValue) => [...currentValue, ...nextEntries]);
      setRunHasMore(!!data?.runs?.hasMore);
      setRunNextOffset(Number(data?.runs?.nextOffset || 0));
      setRunTotal(Number(data?.runs?.total || 0));
    } catch (error) {
      showToast(error.message || "Could not load more runs", "error");
    } finally {
      setLoadingMoreRuns(false);
    }
  }, [
    loadingMoreRuns,
    runDeliveryFilter,
    runHasMore,
    runNextOffset,
    runStatusFilter,
    selectedJobId,
  ]);

  const savePrompt = useCallback(async () => {
    if (!selectedJobId || savingPrompt) return;
    if (promptValue === savedPromptValue) return;
    setSavingPrompt(true);
    try {
      await updateCronJobPrompt(selectedJobId, promptValue);
      setSavedPromptValue(promptValue);
      showToast("Cron prompt updated", "success");
      refreshAll();
    } catch (error) {
      showToast(error.message || "Could not update prompt", "error");
    } finally {
      setSavingPrompt(false);
    }
  }, [promptValue, refreshAll, savedPromptValue, savingPrompt, selectedJobId]);

  return {
    refs: {
      listPanelRef,
    },
    state: {
      jobs,
      jobsError: jobsPoll.error,
      status: statusPoll.data?.status || null,
      statusError: statusPoll.error,
      selectedRouteKey,
      selectedJobId,
      selectedJob,
      listPanelWidthPx,
      isResizingListPanel,
      runEntries,
      runHasMore,
      runNextOffset,
      runTotal,
      runStatusFilter,
      runDeliveryFilter,
      runsError: runsPoll.error,
      loadingMoreRuns,
      usage: usagePoll.data?.usage || null,
      usageError: usagePoll.error,
      usageDays,
      promptValue,
      savedPromptValue,
      savingPrompt,
      runningJob,
      togglingJobEnabled,
    },
    actions: {
      setRunStatusFilter,
      setRunDeliveryFilter,
      setUsageDays,
      setPromptValue,
      savePrompt,
      refreshAll,
      loadMoreRuns,
      runSelectedJobNow,
      setSelectedJobEnabled,
      selectAllJobs,
      selectJob,
      onListResizerPointerDown,
    },
  };
};
