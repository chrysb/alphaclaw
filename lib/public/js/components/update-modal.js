import { h } from "preact";
import { useEffect, useMemo, useState } from "preact/hooks";
import htm from "htm";
import { marked } from "marked";
import { fetchAlphaclawReleaseNotes } from "../lib/api.js";
import { ModalShell } from "./modal-shell.js";
import { ActionButton } from "./action-button.js";
import { LoadingSpinner } from "./loading-spinner.js";
import { CloseIcon } from "./icons.js";

const html = htm.bind(h);

const getReleaseTagFromVersion = (version) => {
  const rawVersion = String(version || "").trim();
  if (!rawVersion) return "";
  return rawVersion.startsWith("v") ? rawVersion : `v${rawVersion}`;
};

const formatPublishedAt = (value) => {
  const dateMs = Date.parse(String(value || ""));
  if (!Number.isFinite(dateMs)) return "";
  try {
    return new Intl.DateTimeFormat(undefined, {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(dateMs));
  } catch {
    return "";
  }
};

const getReleaseUrl = (tag) =>
  tag
    ? `https://github.com/chrysb/alphaclaw/releases/tag/${encodeURIComponent(tag)}`
    : "https://github.com/chrysb/alphaclaw/releases";

const VersionSummaryRow = ({
  label = "",
  currentVersion = "",
  latestVersion = "",
}) => {
  const currentLabel = String(currentVersion || "").trim() || "Unknown";
  const latestLabel = String(latestVersion || "").trim() || "Unknown";
  const changed = currentLabel !== latestLabel;
  return html`
    <div class="ac-surface-inset border border-border rounded-lg px-3 py-2">
      <p class="text-[11px] uppercase tracking-[0.18em] text-fg-muted">${label}</p>
      <p class="mt-1 text-sm text-body">
        ${changed
          ? html`
              <span>${currentLabel}</span>
              <span class="mx-2 text-fg-muted">→</span>
              <span class="font-semibold">${latestLabel}</span>
            `
          : html`<span>${currentLabel}</span>`}
      </p>
    </div>
  `;
};

export const UpdateModal = ({
  visible = false,
  onClose = () => {},
  currentVersion = "",
  currentOpenclawVersion = "",
  version = "",
  latestOpenclawVersion = "",
  updateStrategy = null,
  onUpdate = () => {},
  updating = false,
}) => {
  const requestedTag = useMemo(() => getReleaseTagFromVersion(version), [version]);
  const shouldLoadReleaseNotes =
    visible &&
    String(version || "").trim() &&
    String(currentVersion || "").trim() &&
    String(version || "").trim() !== String(currentVersion || "").trim();
  const canApplyUpdate =
    updateStrategy?.action === "self-update" ||
    updateStrategy?.action === "managed-update";
  const [loadingNotes, setLoadingNotes] = useState(false);
  const [notesError, setNotesError] = useState("");
  const [notesData, setNotesData] = useState(null);

  useEffect(() => {
    if (!visible) return;
    if (!shouldLoadReleaseNotes) {
      setLoadingNotes(false);
      setNotesError("");
      setNotesData(null);
      return;
    }
    let isActive = true;
    const loadNotes = async () => {
      setLoadingNotes(true);
      setNotesError("");
      try {
        const data = await fetchAlphaclawReleaseNotes(requestedTag);
        if (!isActive) return;
        if (!data?.ok) {
          setNotesError(data?.error || "Could not load release notes");
          setNotesData(null);
          return;
        }
        setNotesData(data);
      } catch (err) {
        if (!isActive) return;
        setNotesError(err?.message || "Could not load release notes");
        setNotesData(null);
      } finally {
        if (!isActive) return;
        setLoadingNotes(false);
      }
    };
    loadNotes();
    return () => {
      isActive = false;
    };
  }, [visible, requestedTag, shouldLoadReleaseNotes]);

  const effectiveTag = String(notesData?.tag || requestedTag || "").trim();
  const effectiveReleaseUrl =
    String(notesData?.htmlUrl || "").trim() || getReleaseUrl(effectiveTag);
  const publishedAtLabel = formatPublishedAt(notesData?.publishedAt);
  const releaseBody = String(notesData?.body || "").trim();
  const releasePreviewHtml = useMemo(
    () =>
      marked.parse(releaseBody, {
        gfm: true,
        breaks: true,
      }),
    [releaseBody],
  );
  const strategyLabel = String(updateStrategy?.label || "").trim();
  const strategyDescription = String(updateStrategy?.description || "").trim();
  const strategySteps = Array.isArray(updateStrategy?.steps)
    ? updateStrategy.steps
    : [];
  const templateRepoUrl = String(updateStrategy?.templateRepoUrl || "").trim();
  const showStrategyDetails =
    updateStrategy?.provider === "apex" &&
    updateStrategy?.action === "managed-update"
      ? false
      : Boolean(strategyDescription || strategySteps.length > 0 || templateRepoUrl);
  const primaryActionUrl = String(updateStrategy?.primaryActionUrl || "").trim();
  const primaryLabel = canApplyUpdate
    ? String(updateStrategy?.primaryActionLabel || "").trim() || "Update now"
    : "Done";
  const handlePrimaryAction = () => {
    if (canApplyUpdate) {
      onUpdate();
      return;
    }
    if (primaryActionUrl) {
      try {
        window.open(primaryActionUrl, "_blank", "noopener,noreferrer");
      } catch {}
    }
    onClose();
  };

  return html`
    <${ModalShell}
      visible=${visible}
      onClose=${onClose}
      panelClassName="relative bg-modal border border-border rounded-xl p-5 w-full max-w-3xl max-h-[92vh] overflow-hidden flex flex-col gap-4"
    >
      <button
        type="button"
        onclick=${onClose}
        class="absolute top-5 right-5 h-8 w-8 inline-flex items-center justify-center rounded-lg ac-btn-secondary"
        aria-label="Close modal"
      >
        <${CloseIcon} className="w-3.5 h-3.5 text-body" />
      </button>
      <div class="space-y-1 pr-10">
        <h3 class="text-sm font-semibold">Update available</h3>
        <p class="text-xs text-fg-muted">
          ${strategyLabel
            ? `Detected deployment target: ${strategyLabel}`
            : "Review the latest bundled versions before updating."}
        </p>
      </div>

      <div class="grid gap-2 sm:grid-cols-2">
        <${VersionSummaryRow}
          label="AlphaClaw"
          currentVersion=${currentVersion}
          latestVersion=${version}
        />
        <${VersionSummaryRow}
          label="OpenClaw"
          currentVersion=${currentOpenclawVersion}
          latestVersion=${latestOpenclawVersion || currentOpenclawVersion}
        />
      </div>

      ${shouldLoadReleaseNotes
        ? html`
            ${publishedAtLabel
              ? html`<p class="text-xs text-fg-muted">Published ${publishedAtLabel}</p>`
              : null}
            <div class="ac-surface-inset border border-border rounded-lg p-2 overflow-auto min-h-[220px] max-h-[52vh]">
              ${loadingNotes
                ? html`
                    <div class="min-h-[200px] flex items-center justify-center text-fg-muted">
                      <span class="inline-flex items-center gap-2 text-sm">
                        <${LoadingSpinner} className="h-4 w-4" />
                        Loading release notes...
                      </span>
                    </div>
                  `
                : notesError
                  ? html`
                      <div class="space-y-2">
                        <p class="text-sm text-status-error">${notesError}</p>
                        <a
                          class="ac-tip-link text-xs"
                          href=${effectiveReleaseUrl}
                          target="_blank"
                          rel="noreferrer"
                          >View release on GitHub</a
                        >
                      </div>
                    `
                  : releaseBody
                    ? html`<div
                        class="file-viewer-preview release-notes-preview"
                        dangerouslySetInnerHTML=${{ __html: releasePreviewHtml }}
                      ></div>`
                    : html`
                        <div class="space-y-2">
                          <p class="text-sm text-body">
                            No release notes were published for this tag.
                          </p>
                          <a
                            class="ac-tip-link text-xs"
                            href=${effectiveReleaseUrl}
                            target="_blank"
                            rel="noreferrer"
                            >Open release on GitHub</a
                          >
                        </div>
                      `}
            </div>
          `
        : null}

      ${showStrategyDetails &&
      html`
        <div class="ac-surface-inset border border-border rounded-lg p-3 space-y-2">
          ${strategyDescription
            ? html`<p class="text-sm text-body">${strategyDescription}</p>`
            : null}
          ${strategySteps.length > 0
            ? html`
                <ol class="space-y-2 text-sm text-body list-decimal list-outside ml-6 pl-0">
                  ${strategySteps.map(
                    (step) => html`<li key=${step}>${step}</li>`,
                  )}
                </ol>
              `
            : null}
          ${templateRepoUrl
            ? html`
                <a
                  class="ac-tip-link text-xs block mt-3"
                  href=${templateRepoUrl}
                  target="_blank"
                  rel="noreferrer"
                  >View deployment template</a
                >
              `
            : null}
        </div>
      `}

      <div class="flex items-center justify-end gap-2 pt-1">
        <${ActionButton}
          onClick=${onClose}
          tone="ghost"
          idleLabel="Later"
          disabled=${updating}
        />
        <${ActionButton}
          onClick=${handlePrimaryAction}
          tone=${canApplyUpdate ? "warning" : "neutral"}
          idleLabel=${primaryLabel}
          loadingLabel=${canApplyUpdate ? "Updating..." : primaryLabel}
          loading=${canApplyUpdate && updating}
          disabled=${canApplyUpdate ? loadingNotes : false}
        />
      </div>
    </${ModalShell}>
  `;
};
