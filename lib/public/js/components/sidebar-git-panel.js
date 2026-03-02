import { h } from "https://esm.sh/preact";
import { useEffect, useState } from "https://esm.sh/preact/hooks";
import htm from "https://esm.sh/htm";
import { fetchBrowseGitSummary } from "../lib/api.js";
import { GitBranchLineIcon, GithubFillIcon } from "./icons.js";
import { LoadingSpinner } from "./loading-spinner.js";

const html = htm.bind(h);
const kRefreshMs = 10000;

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

export const SidebarGitPanel = () => {
  const [loading, setLoading] = useState(true);
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
        <span class=${`sidebar-git-dirty ${summary.isDirty ? "is-dirty" : "is-clean"}`}>
          ${summary.isDirty ? "dirty" : "clean"}
        </span>
      </div>
      ${(summary.commits || []).length > 0
        ? html`
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
  `;
};
