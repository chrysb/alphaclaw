export const getDoctorPriorityTone = (priority = "") => {
  const normalized = String(priority || "").trim().toUpperCase();
  if (normalized === "P0") return "danger";
  if (normalized === "P1") return "warning";
  return "neutral";
};

export const getDoctorStatusTone = (status = "") => {
  const normalized = String(status || "").trim().toLowerCase();
  if (normalized === "fixed") return "success";
  if (normalized === "dismissed") return "neutral";
  return "warning";
};

export const getDoctorCategoryTone = (category = "") => {
  const normalized = String(category || "")
    .trim()
    .toLowerCase()
    .replace(/[_-]+/g, " ");
  if (normalized === "token efficiency") return "info";
  if (normalized === "redundancy") return "accent";
  if (normalized === "mixed concerns") return "cyan";
  if (normalized === "workspace state") return "secondary";
  return "info";
};

export const formatDoctorCategory = (category = "") => {
  const normalized = String(category || "")
    .trim()
    .replace(/[_-]+/g, " ");
  if (!normalized) return "Workspace";
  return normalized.replace(/\b\w/g, (character) => character.toUpperCase());
};

export const buildDoctorPriorityCounts = (cards = []) =>
  cards.reduce(
    (totals, card) => {
      const priority = String(card?.priority || "").trim().toUpperCase();
      if (priority === "P0" || priority === "P1" || priority === "P2") {
        totals[priority] += 1;
      }
      return totals;
    },
    { P0: 0, P1: 0, P2: 0 },
  );

export const groupDoctorCardsByStatus = (cards = []) =>
  cards.reduce(
    (groups, card) => {
      const status = String(card?.status || "open").trim().toLowerCase();
      if (status === "fixed") {
        groups.fixed.push(card);
        return groups;
      }
      if (status === "dismissed") {
        groups.dismissed.push(card);
        return groups;
      }
      groups.open.push(card);
      return groups;
    },
    { open: [], dismissed: [], fixed: [] },
  );

export const shouldShowDoctorWarning = (
  doctorStatus = null,
  dismissedUntilMs = 0,
) => {
  if (!doctorStatus || doctorStatus.runInProgress) return false;
  if (doctorStatus.needsInitialRun || !doctorStatus.stale) return false;
  if (!doctorStatus.changeSummary?.hasMeaningfulChanges) return false;
  return Number(dismissedUntilMs || 0) <= Date.now();
};

export const getDoctorWarningMessage = (doctorStatus = null) => {
  if (!doctorStatus) return "";
  const changedFilesCount = Number(doctorStatus.changeSummary?.changedFilesCount || 0);
  if (changedFilesCount > 0) {
    return `Drift Doctor has not been run in the last week and ${changedFilesCount} file${changedFilesCount === 1 ? "" : "s"} changed since the last review.`;
  }
  return "Doctor has not been run in the last week.";
};

export const getDoctorChangeLabel = (changeSummary = null) => {
  const changedFilesCount = Number(changeSummary?.changedFilesCount || 0);
  if (changedFilesCount === 0) return "No changes since last run";
  return `${changedFilesCount} change${changedFilesCount === 1 ? "" : "s"} since last run`;
};

export const getDoctorRunPillDetail = (run = null) => {
  if (!run || typeof run !== "object") return "";
  if (run.status === "running") return "Running";
  if (run.status === "failed") return "Failed";
  if ((run.cardCount || 0) === 0) return "No findings";
  return `${run.cardCount || 0} finding${run.cardCount === 1 ? "" : "s"}`;
};

export const buildDoctorRunMarkers = (run = null) => {
  if (!run || typeof run !== "object") return [];
  if (run.status === "running") {
    return [{ tone: "cyan", count: 0, label: "Running" }];
  }
  if (run.status === "failed") {
    return [{ tone: "neutral", count: 0, label: "Failed" }];
  }
  if ((run.cardCount || 0) === 0) {
    return [{ tone: "success", count: 0, label: "No findings" }];
  }
  const highPriority = [];
  if (Number(run?.priorityCounts?.P0 || 0) > 0) {
    highPriority.push({ tone: "danger", count: 0, label: "P0" });
  }
  if (Number(run?.priorityCounts?.P1 || 0) > 0) {
    highPriority.push({ tone: "warning", count: 0, label: "P1" });
  }
  if (highPriority.length > 0) return highPriority.slice(0, 2);
  return [{ tone: "neutral", count: 0, label: "P2" }];
};

export const buildDoctorStatusFilterOptions = () => [
  { value: "open", label: "Open" },
  { value: "dismissed", label: "Dismissed" },
  { value: "fixed", label: "Fixed" },
];
