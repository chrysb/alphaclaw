import { h } from "https://esm.sh/preact";
import { useEffect, useMemo, useState } from "https://esm.sh/preact/hooks";
import htm from "https://esm.sh/htm";
import { marked } from "https://esm.sh/marked";
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

export const UpdateModal = ({
  visible = false,
  onClose = () => {},
  version = "",
  onUpdate = () => {},
  updating = false,
}) => {
  const requestedTag = useMemo(() => getReleaseTagFromVersion(version), [version]);
  const [loadingNotes, setLoadingNotes] = useState(false);
  const [notesError, setNotesError] = useState("");
  const [notesData, setNotesData] = useState(null);

  useEffect(() => {
    if (!visible) return;
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
  }, [visible, requestedTag]);

  const effectiveTag = String(notesData?.tag || requestedTag || "").trim();
  const effectiveReleaseUrl =
    String(notesData?.htmlUrl || "").trim() || getReleaseUrl(effectiveTag);
  const updateLabel = effectiveTag ? `Update to ${effectiveTag}` : "Update now";
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
        <${CloseIcon} className="w-3.5 h-3.5 text-gray-300" />
      </button>
      <div class="space-y-1 pr-10">
        <h3 class="text-sm font-semibold">AlphaClaw release notes</h3>
        ${publishedAtLabel
          ? html`<p class="text-xs text-gray-500">Published ${publishedAtLabel}</p>`
          : null}
      </div>
      <div class="ac-surface-inset border border-border rounded-lg p-2 overflow-auto min-h-[220px] max-h-[66vh]">
        ${loadingNotes
          ? html`
              <div class="min-h-[200px] flex items-center justify-center text-gray-400">
                <span class="inline-flex items-center gap-2 text-sm">
                  <${LoadingSpinner} className="h-4 w-4" />
                  Loading release notes...
                </span>
              </div>
            `
          : notesError
            ? html`
                <div class="space-y-2">
                  <p class="text-sm text-red-300">${notesError}</p>
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
                    <p class="text-sm text-gray-300">No release notes were published for this tag.</p>
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
      <div class="flex items-center justify-end gap-2 pt-1">
        <${ActionButton}
          onClick=${onClose}
          tone="ghost"
          idleLabel="Later"
          disabled=${updating}
        />
        <${ActionButton}
          onClick=${onUpdate}
          tone="warning"
          idleLabel=${updateLabel}
          loadingLabel="Updating..."
          loading=${updating}
          disabled=${loadingNotes}
        />
      </div>
    </${ModalShell}>
  `;
};
