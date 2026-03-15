import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "https://esm.sh/preact/hooks";
import { usePolling } from "../../hooks/usePolling.js";
import { useDestinationSessionSelection } from "../../hooks/use-destination-session-selection.js";
import {
  fetchCronBulkRuns,
  fetchCronBulkUsage,
  fetchCronJobRuns,
  fetchCronJobTrends,
  fetchCronJobs,
  fetchCronJobUsage,
  fetchCronStatus,
  setCronJobEnabled,
  triggerCronJobRun,
  updateCronJobPrompt,
  updateCronJobRouting,
} from "../../lib/api.js";
import { readUiSettings, writeUiSettings } from "../../lib/ui-settings.js";
import { showToast } from "../toast.js";
import { kAllCronJobsRouteKey } from "./cron-helpers.js";

const kDefaultListPanelWidthPx = 372;
const kListPanelMinWidthPx = 220;
const kListPanelMaxWidthPx = 480;
const kListPanelWidthUiSettingKey = "cronListPanelWidthPx";
const kRunsPageSize = 25;
const kCalendarUsageDays = 30;
const kCalendarPastDays = 30;
const kTrendRange24h = "24h";
const kTrendRange7d = "7d";
const kTrendRange30d = "30d";
const kRoutingDefaults = {
  sessionTarget: "main",
  wakeMode: "now",
  deliveryMode: "none",
  deliveryChannel: "",
  deliveryTo: "",
};
const readRoutingDraftFromJob = (job = null) => ({
  sessionTarget: String(job?.sessionTarget || kRoutingDefaults.sessionTarget),
  wakeMode: String(job?.wakeMode || kRoutingDefaults.wakeMode),
  deliveryMode: String(job?.delivery?.mode || kRoutingDefaults.deliveryMode),
  deliveryChannel: String(job?.delivery?.channel || ""),
  deliveryTo: String(job?.delivery?.to || ""),
});

const clampListPanelWidth = (value) =>
  Math.max(kListPanelMinWidthPx, Math.min(kListPanelMaxWidthPx, value));

const normalizeRouteJobId = (jobId = "") => {
  const normalized = String(jobId || "").trim();
  return normalized || kAllCronJobsRouteKey;
};

export const useCronTab = ({ jobId = "", onSetLocation = () => {} } = {}) => {
  const selectedRouteKey = normalizeRouteJobId(jobId);
  const selectedJobId =
    selectedRouteKey === kAllCronJobsRouteKey ? "" : selectedRouteKey;
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
  const [runEntries, setRunEntries] = useState([]);
  const [runHasMore, setRunHasMore] = useState(false);
  const [runNextOffset, setRunNextOffset] = useState(0);
  const [runTotal, setRunTotal] = useState(0);
  const [loadingMoreRuns, setLoadingMoreRuns] = useState(false);
  const [promptValue, setPromptValue] = useState("");
  const [savedPromptValue, setSavedPromptValue] = useState("");
  const [savingChanges, setSavingChanges] = useState(false);
  const [runningJob, setRunningJob] = useState(false);
  const [togglingJobEnabled, setTogglingJobEnabled] = useState(false);
  const [routingDraft, setRoutingDraft] = useState(kRoutingDefaults);
  const [usageDays, setUsageDays] = useState(30);
  const [jobTrendRange, setJobTrendRange] = useState(kTrendRange7d);
  const [selectedJobTrendBucketFilter, setSelectedJobTrendBucketFilter] = useState(null);
  const {
    sessions: deliverySessions,
    loading: loadingDeliverySessions,
    error: deliverySessionsError,
    destinationSessionKey,
    setDestinationSessionKey,
    selectedDestination,
  } = useDestinationSessionSelection({
    enabled: !!selectedJobId,
    resetKey: String(selectedJobId || ""),
  });

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
  const trendsPoll = usePolling(
    () => {
      if (!selectedJobId) return Promise.resolve({ ok: true, trends: null });
      return fetchCronJobTrends(selectedJobId, { range: jobTrendRange });
    },
    60000,
    { enabled: !!selectedJobId },
  );
  const bulkUsagePoll = usePolling(
    () => fetchCronBulkUsage({ days: kCalendarUsageDays }),
    60000,
    { enabled: !selectedJobId },
  );
  const bulkRunsPoll = usePolling(
    () =>
      fetchCronBulkRuns({
        sinceMs: Date.now() - kCalendarPastDays * 24 * 60 * 60 * 1000,
        limitPerJob: 1200,
      }),
    30000,
    { enabled: !selectedJobId },
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
      setRoutingDraft(kRoutingDefaults);
      return;
    }
    const prompt = String(selectedJob?.payload?.message || "");
    setPromptValue(prompt);
    setSavedPromptValue(prompt);
    setRoutingDraft(readRoutingDraftFromJob(selectedJob));
  }, [selectedJobId, selectedJob?.payload?.message]);

  useEffect(() => {
    if (!selectedJobId) return;
    setRoutingDraft(readRoutingDraftFromJob(selectedJob));
  }, [
    selectedJobId,
    selectedJob?.sessionTarget,
    selectedJob?.wakeMode,
    selectedJob?.delivery?.mode,
  ]);

  useEffect(() => {
    setRunEntries([]);
    setRunHasMore(false);
    setRunNextOffset(0);
    setRunTotal(0);
    if (!selectedJobId) return;
    runsPoll.refresh();
  }, [selectedJobId, runStatusFilter]);

  useEffect(() => {
    if (!selectedJobId) return;
    usagePoll.refresh();
  }, [selectedJobId, usageDays]);
  useEffect(() => {
    if (!selectedJobId) return;
    setSelectedJobTrendBucketFilter(null);
    trendsPoll.refresh();
  }, [jobTrendRange, selectedJobId]);
  const filteredRunEntries = useMemo(() => {
    const entries = Array.isArray(runEntries) ? runEntries : [];
    const filterValue = selectedJobTrendBucketFilter;
    if (!filterValue) return entries;
    const startMs = Number(filterValue?.startMs || 0);
    const endMs = Number(filterValue?.endMs || 0);
    if (!Number.isFinite(startMs) || !Number.isFinite(endMs) || endMs <= startMs) {
      return entries;
    }
    return entries.filter((entry) => {
      const timestampMs = Number(entry?.ts || 0);
      return (
        Number.isFinite(timestampMs) &&
        timestampMs >= startMs &&
        timestampMs < endMs
      );
    });
  }, [runEntries, selectedJobTrendBucketFilter]);

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
    trendsPoll.refresh();
    bulkUsagePoll.refresh();
    bulkRunsPoll.refresh();
  }, [
    bulkRunsPoll.refresh,
    bulkUsagePoll.refresh,
    jobsPoll.refresh,
    runsPoll.refresh,
    statusPoll.refresh,
    trendsPoll.refresh,
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
    runHasMore,
    runNextOffset,
    runStatusFilter,
    selectedJobId,
  ]);

  const saveChanges = useCallback(async () => {
    if (!selectedJobId || !selectedJob || savingChanges) return;
    const currentRouting = readRoutingDraftFromJob(selectedJob);
    const nextRouting = {
      sessionTarget: String(routingDraft?.sessionTarget || kRoutingDefaults.sessionTarget),
      wakeMode: String(routingDraft?.wakeMode || kRoutingDefaults.wakeMode),
      deliveryMode: String(routingDraft?.deliveryMode || kRoutingDefaults.deliveryMode),
      deliveryChannel: String(routingDraft?.deliveryChannel || ""),
      deliveryTo: String(routingDraft?.deliveryTo || ""),
    };
    const routingUnchanged =
      nextRouting.sessionTarget === currentRouting.sessionTarget &&
      nextRouting.wakeMode === currentRouting.wakeMode &&
      nextRouting.deliveryMode === currentRouting.deliveryMode &&
      nextRouting.deliveryChannel === currentRouting.deliveryChannel &&
      nextRouting.deliveryTo === currentRouting.deliveryTo;
    const promptUnchanged = promptValue === savedPromptValue;
    if (routingUnchanged && promptUnchanged) return;
    setSavingChanges(true);
    try {
      if (!routingUnchanged) {
        await updateCronJobRouting(selectedJobId, nextRouting);
      }
      if (!promptUnchanged) {
        await updateCronJobPrompt(selectedJobId, promptValue);
        setSavedPromptValue(promptValue);
      }
      showToast("Changes saved", "success");
      refreshAll();
    } catch (error) {
      showToast(error.message || "Could not save changes", "error");
    } finally {
      setSavingChanges(false);
    }
  }, [
    promptValue,
    refreshAll,
    routingDraft,
    savedPromptValue,
    savingChanges,
    selectedJob,
    selectedJobId,
  ]);

  useEffect(() => {
    if (!selectedJobId) return;
    if (String(routingDraft?.deliveryMode || "none") !== "announce") return;
    if (!selectedDestination?.channel && !selectedDestination?.to) return;
    setRoutingDraft((currentValue = kRoutingDefaults) => {
      const nextChannel = String(selectedDestination?.channel || currentValue.deliveryChannel || "");
      const nextTo = String(selectedDestination?.to || currentValue.deliveryTo || "");
      if (
        nextChannel === String(currentValue.deliveryChannel || "") &&
        nextTo === String(currentValue.deliveryTo || "")
      ) {
        return currentValue;
      }
      return {
        ...currentValue,
        deliveryChannel: nextChannel,
        deliveryTo: nextTo,
      };
    });
  }, [
    routingDraft?.deliveryMode,
    selectedDestination?.channel,
    selectedDestination?.to,
    selectedJobId,
  ]);

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
      filteredRunEntries,
      runHasMore,
      runNextOffset,
      runTotal,
      runStatusFilter,
      runsError: runsPoll.error,
      loadingMoreRuns,
      usage: usagePoll.data?.usage || null,
      jobTrends: trendsPoll.data?.trends || null,
      usageError: usagePoll.error,
      trendsError: trendsPoll.error,
      usageDays,
      jobTrendRange:
        jobTrendRange === kTrendRange30d
          ? kTrendRange30d
          : jobTrendRange === kTrendRange24h
            ? kTrendRange24h
            : kTrendRange7d,
      selectedJobTrendBucketFilter,
      bulkUsageByJobId: bulkUsagePoll.data?.usage?.byJobId || {},
      bulkUsageError: bulkUsagePoll.error,
      bulkRunsByJobId: bulkRunsPoll.data?.runs?.byJobId || {},
      bulkRunsError: bulkRunsPoll.error,
      promptValue,
      savedPromptValue,
      savingChanges,
      runningJob,
      togglingJobEnabled,
      routingDraft,
      deliverySessions,
      loadingDeliverySessions,
      deliverySessionsError,
      destinationSessionKey,
    },
    actions: {
      setRunStatusFilter,
      setUsageDays,
      setJobTrendRange,
      setSelectedJobTrendBucketFilter,
      setPromptValue,
      saveChanges,
      refreshAll,
      loadMoreRuns,
      runSelectedJobNow,
      setSelectedJobEnabled,
      selectAllJobs,
      selectJob,
      onListResizerPointerDown,
      setRoutingDraft,
      setDestinationSessionKey,
    },
  };
};
