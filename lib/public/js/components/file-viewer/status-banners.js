import { h } from "preact";
import htm from "htm";
import { ActionButton } from "../action-button.js";
import { LockLineIcon } from "../icons.js";

const html = htm.bind(h);

export const FileViewerStatusBanners = ({
  isDiffView,
  onRequestEdit,
  normalizedPath,
  isDeletedDiff = false,
  isLockedFile,
  isProtectedFile,
  isProtectedLocked,
  handleEditProtectedFile,
}) => html`
  ${isDiffView
    ? html`
        <div class="file-viewer-protected-banner file-viewer-diff-banner">
          <div class="file-viewer-protected-banner-text">Viewing unsynced changes</div>
          ${!isDeletedDiff
            ? html`
                <${ActionButton}
                  onClick=${() => onRequestEdit(normalizedPath)}
                  tone="secondary"
                  size="sm"
                  idleLabel="View file"
                />
              `
            : null}
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
