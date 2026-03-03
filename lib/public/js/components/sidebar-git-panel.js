import { h } from "https://esm.sh/preact";
import { useEffect, useState } from "https://esm.sh/preact/hooks";
import htm from "https://esm.sh/htm";
import { fetchBrowseGitSummary, syncBrowseChanges } from "../lib/api.js";
import { ActionButton } from "./action-button.js";
import { GitBranchLineIcon, GithubFillIcon } from "./icons.js";
import { LoadingSpinner } from "./loading-spinner.js";
import { showToast } from "./toast.js";

const html = htm.bind(h);
const kRefreshMs = 10000;
const kSyncCommitFileNameLimit = 4;

const formatCommitTime = (unixSeconds) => {
  if (!unixSeconds) return "";
  try {
    return new Date(unixSeconds * 1000).toLocaleString();
  } catch {
    return "";
  }
};

const getRepoName = (summary) => {
  const slug = String(summary?.repoSlug || "").trim();
  if (slug) return slug;
  const pathValue = String(summary?.repoPath || "");
  const segment = pathValue.split("/").filter(Boolean).pop();
  return segment || "repo";
};

const getChangedFilePresentation = (changedFile) => {
  const statusKind = String(changedFile?.statusKind || "M").toUpperCase();
  if (statusKind === "U") {
    return {
      statusLabel: "U",
      statusClass: "is-untracked",
      rowClass: "is-clickable",
      canOpen: true,
    };
  }
  if (statusKind === "D") {
    return {
      statusLabel: "D",
      statusClass: "is-deleted",
      rowClass: "",
      canOpen: false,
    };
  }
  return {
    statusLabel: "M",
    statusClass: "is-modified",
    rowClass: "is-clickable",
    canOpen: true,
  };
};

const formatDelta = (value, prefix) => {
  if (value === null || value === undefined || value === "") return "";
  const numericValue = Number(value);
  if (!Number.isFinite(numericValue) || numericValue <= 0) return "";
  return `${prefix}${numericValue}`;
};

const getRemoteSyncPresentation = (summary) => {
  const safeState = String(summary?.syncState || "").trim();
  const aheadCount = Number(summary?.aheadCount) || 0;
  const behindCount = Number(summary?.behindCount) || 0;
  if (safeState === "ahead") {
    return {
      label: "↑",
      title: `Ahead by ${aheadCount}`,
      className: "is-ahead",
    };
  }
  if (safeState === "behind") {
    return {
      label: "↓",
      title: `Behind by ${behindCount}`,
      className: "is-behind",
    };
  }
  if (safeState === "diverged") {
    return {
      label: "↕",
      title: `Diverged (${aheadCount} ahead, ${behindCount} behind)`,
      className: "is-diverged",
    };
  }
  if (safeState === "upstream-gone") {
    return {
      label: "!",
      title: "Upstream missing",
      className: "is-upstream-gone",
    };
  }
  if (safeState === "no-upstream" || !summary?.hasUpstream) {
    return {
      label: "!",
      title: "Not linked",
      className: "is-no-upstream",
    };
  }
  return {
    label: "",
    title: "Up to date",
    className: "is-up-to-date",
  };
};

const buildSyncCommitMessage = (changedFiles) => {
  const filePaths = Array.isArray(changedFiles)
    ? changedFiles
        .map((file) => String(file?.path || "").trim())
        .filter(Boolean)
    : [];
  const totalCount = filePaths.length;
  if (totalCount <= 0) return "sync changes";

  const fileNames = filePaths.map((filePath) => filePath.split("/").filter(Boolean).pop() || filePath);
  const uniqueFileNames = Array.from(new Set(fileNames));
  const shownFileNames = uniqueFileNames.slice(0, kSyncCommitFileNameLimit);
  const remainingCount = Math.max(0, uniqueFileNames.length - shownFileNames.length);
  const noun = totalCount === 1 ? "file" : "files";
  const suffix = remainingCount > 0 ? ` +${remainingCount} more` : "";
  return `Edited ${totalCount} ${noun} - ${shownFileNames.join(", ")}${suffix}`;
};

export const SidebarGitPanel = ({ onSelectFile = () => {} }) => {
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState("");
  const [summary, setSummary] = useState(null);

  useEffect(() => {
    let active = true;
    let intervalId = null;

    const loadSummary = async () => {
      if (!active) return;
      try {
        const data = await fetchBrowseGitSummary();
        if (!active) return;
        setSummary(data);
        setError("");
      } catch (nextError) {
        if (!active) return;
        setError(nextError.message || "Could not load git summary");
      } finally {
        if (active) setLoading(false);
      }
    };

    const handleFileSaved = () => {
      loadSummary();
    };

    loadSummary();
    intervalId = window.setInterval(loadSummary, kRefreshMs);
    window.addEventListener("alphaclaw:browse-file-saved", handleFileSaved);

    return () => {
      active = false;
      if (intervalId) window.clearInterval(intervalId);
      window.removeEventListener("alphaclaw:browse-file-saved", handleFileSaved);
    };
  }, []);

  if (loading) {
    return html`
      <div class="sidebar-git-panel sidebar-git-loading" aria-label="Loading git summary">
        <${LoadingSpinner} className="h-4 w-4" />
      </div>
    `;
  }

  if (error) {
    return html`<div class="sidebar-git-panel sidebar-git-panel-error">${error}</div>`;
  }

  if (!summary?.isRepo) {
    return html`
      <div class="sidebar-git-panel">
        <div class="sidebar-git-meta">No git repo at this root</div>
      </div>
    `;
  }

  const hasUncommittedChanges = (summary.changedFiles || []).length > 0;
  const aheadCount = Number(summary?.aheadCount) || 0;
  const canSyncChanges = hasUncommittedChanges || aheadCount > 0;
  const remoteSync = getRemoteSyncPresentation(summary);
  const handleSyncChanges = async () => {
    if (!canSyncChanges || syncing) return;
    try {
      setSyncing(true);
      const commitMessage = buildSyncCommitMessage(summary?.changedFiles || []);
      const syncResult = await syncBrowseChanges(commitMessage);
      if (syncResult?.committed || syncResult?.pushed) {
        window.dispatchEvent(new CustomEvent("alphaclaw:browse-git-synced"));
        showToast(syncResult.message || "Changes synced", "success");
      } else {
        showToast(syncResult?.message || "No changes to sync", "info");
      }
      const nextSummary = await fetchBrowseGitSummary();
      setSummary(nextSummary);
      setError("");
    } catch (syncError) {
      showToast(syncError.message || "Could not sync changes", "error");
    } finally {
      setSyncing(false);
    }
  };

  return html`
    <div class="sidebar-git-panel">
      <div class="sidebar-git-bar">
        ${summary.repoUrl
          ? html`
              <a
                class="sidebar-git-bar-main sidebar-git-link"
                href=${summary.repoUrl}
                target="_blank"
                rel="noopener noreferrer"
                title=${summary.repoUrl}
              >
                <${GithubFillIcon} className="sidebar-git-bar-icon" />
                <span class="sidebar-git-repo-name">${getRepoName(summary)}</span>
              </a>
            `
          : html`
              <span class="sidebar-git-bar-main">
                <${GithubFillIcon} className="sidebar-git-bar-icon" />
                <span class="sidebar-git-repo-name">${getRepoName(summary)}</span>
              </span>
            `}
      </div>
      <div class="sidebar-git-bar sidebar-git-bar-secondary">
        <span class="sidebar-git-bar-main">
          <${GitBranchLineIcon} className="sidebar-git-bar-icon" />
          <span class="sidebar-git-branch">${summary.branch || "unknown"}</span>
        </span>
        ${remoteSync.label
          ? html`
              <span
                class=${`sidebar-git-sync-status ${remoteSync.className}`.trim()}
                title=${remoteSync.title || ""}
                aria-label=${remoteSync.title || ""}
              >
                ${remoteSync.label}
              </span>
            `
          : null}
      </div>
      <div class="sidebar-git-scroll">
        ${(summary.changedFiles || []).length > 0
          ? html`
              <div class="sidebar-git-changes-label">
                ${`Unsynced Changes (${summary.changedFilesCount || (summary.changedFiles || []).length})`}
              </div>
              <ul class="sidebar-git-changes-list">
                ${(summary.changedFiles || []).map((changedFile) => {
                  const presentation = getChangedFilePresentation(changedFile);
                  const changedPath = String(changedFile?.path || "");
                  const plusDelta = formatDelta(changedFile?.addedLines, "+");
                  const minusDelta = formatDelta(changedFile?.deletedLines, "-");
                  return html`
                    <li
                      class=${`sidebar-git-change-row ${presentation.statusClass} ${presentation.rowClass}`.trim()}
                      title=${changedPath}
                      onclick=${() => {
                        if (!presentation.canOpen || !changedPath) return;
                        onSelectFile(changedPath, { view: "diff" });
                      }}
                    >
                      <span class="sidebar-git-change-path">${changedPath}</span>
                      <span class="sidebar-git-change-meta">
                        ${plusDelta
                          ? html`<span class="sidebar-git-change-plus">${plusDelta}</span>`
                          : null}
                        ${minusDelta
                          ? html`<span class="sidebar-git-change-minus">${minusDelta}</span>`
                          : null}
                        <span class="sidebar-git-change-status">${presentation.statusLabel}</span>
                      </span>
                    </li>
                  `;
                })}
              </ul>
              <div class="sidebar-git-actions">
                <${ActionButton}
                  onClick=${handleSyncChanges}
                  disabled=${!canSyncChanges}
                  loading=${syncing}
                  loadingMode="inline"
                  idleLabel="Sync Changes"
                  loadingLabel="Syncing..."
                  tone="primary"
                  size="sm"
                  className="sidebar-git-sync-button"
                />
              </div>
            `
          : null}
        ${(summary.commits || []).length > 0
          ? html`
              <div class="sidebar-git-changes-label">commit history</div>
              <ul class="sidebar-git-list">
                ${(summary.commits || []).slice(0, 4).map(
                  (commit) => html`
                    <li title=${formatCommitTime(commit.timestamp)}>
                      ${commit.url
                        ? html`
                            <a
                              class="sidebar-git-commit-link"
                              href=${commit.url}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              <span class="sidebar-git-hash">${commit.shortHash}</span>
                              <span>${commit.message}</span>
                            </a>
                          `
                        : html`
                            <span class="sidebar-git-hash">${commit.shortHash}</span>
                            <span>${commit.message}</span>
                          `}
                    </li>
                  `,
                )}
              </ul>
            `
          : null}
      </div>
    </div>
  `;
};
