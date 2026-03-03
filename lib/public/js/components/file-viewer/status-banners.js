import { h } from "https://esm.sh/preact";
import htm from "https://esm.sh/htm";
import { ActionButton } from "../action-button.js";
import { LockLineIcon } from "../icons.js";

const html = htm.bind(h);

export const FileViewerStatusBanners = ({
  isDiffView,
  onRequestEdit,
  normalizedPath,
  isLockedFile,
  isProtectedFile,
  isProtectedLocked,
  handleEditProtectedFile,
}) => html`
  ${isDiffView
    ? html`
        <div class="file-viewer-protected-banner file-viewer-diff-banner">
          <div class="file-viewer-protected-banner-text">Viewing unsynced changes</div>
          <${ActionButton}
            onClick=${() => onRequestEdit(normalizedPath)}
            tone="secondary"
            size="sm"
            idleLabel="View file"
          />
        </div>
      `
    : null}
  ${!isDiffView && isLockedFile
    ? html`
        <div class="file-viewer-protected-banner is-locked">
          <${LockLineIcon} className="file-viewer-protected-banner-icon" />
          <div class="file-viewer-protected-banner-text">
            This file is managed by AlphaClaw and cannot be edited.
          </div>
        </div>
      `
    : null}
  ${!isDiffView && isProtectedFile
    ? html`
        <div class="file-viewer-protected-banner">
          <div class="file-viewer-protected-banner-text">
            Protected file. Changes may break workspace behavior.
          </div>
          ${isProtectedLocked
            ? html`
                <${ActionButton}
                  onClick=${handleEditProtectedFile}
                  tone="warning"
                  size="sm"
                  idleLabel="Edit anyway"
                />
              `
            : null}
        </div>
      `
    : null}
`;
