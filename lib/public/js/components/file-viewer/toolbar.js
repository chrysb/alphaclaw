import { h } from "preact";
import htm from "htm";
import { ActionButton } from "../action-button.js";
import { SegmentedControl } from "../segmented-control.js";
import { DeleteBinLineIcon, RestartLineIcon, SaveFillIcon } from "../icons.js";

const html = htm.bind(h);

export const FileViewerToolbar = ({
  pathSegments,
  isDirty,
  isPreviewOnly,
  isDiffView,
  isMarkdownFile,
  viewMode,
  handleChangeViewMode,
  handleSave,
  handleDiscard,
  loading,
  canEditFile,
  isEditBlocked,
  isImageFile,
  isAudioFile,
  isSqliteFile,
  saving,
  deleting,
  restoring,
  canDeleteFile,
  isDeleteBlocked,
  isProtectedFile,
  canRestoreDeletedDiff,
  onRequestDelete,
  onRequestRestore,
}) => html`
  <div class="file-viewer-tabbar">
    <div class="file-viewer-tab active">
      <span class="file-icon">f</span>
      <span class="file-viewer-breadcrumb">
        ${pathSegments.map(
          (segment, index) => html`
            <span class="file-viewer-breadcrumb-item">
              <span
                class=${index === pathSegments.length - 1 ? "is-current" : ""}
              >
                ${segment}
              </span>
              ${index < pathSegments.length - 1 &&
              html`<span class="file-viewer-sep">></span>`}
            </span>
          `,
        )}
      </span>
      ${isDirty
        ? html`<span class="file-viewer-dirty-dot" aria-hidden="true"></span>`
        : null}
    </div>
    <div class="file-viewer-tabbar-spacer"></div>
    ${isPreviewOnly
      ? html`<div class="file-viewer-preview-pill">Preview</div>`
      : null}
    ${!isDiffView &&
    isMarkdownFile &&
    html`
      <${SegmentedControl}
        className="mr-2.5"
        options=${[
          { label: "edit", value: "edit" },
          { label: "preview", value: "preview" },
        ]}
        value=${viewMode}
        onChange=${handleChangeViewMode}
      />
    `}
    ${!isDiffView
      ? !isImageFile && !isAudioFile && !isSqliteFile
        ? html`
            ${!isProtectedFile
              ? html`
                  <${ActionButton}
                    onClick=${onRequestDelete}
                    disabled=${!canDeleteFile || deleting}
                    tone="secondary"
                    size="sm"
                    iconOnly=${true}
                    idleLabel=""
                    idleIcon=${DeleteBinLineIcon}
                    idleIconClassName="file-viewer-icon-action-icon"
                    className="file-viewer-save-action"
                    title=${isDeleteBlocked
                      ? "Locked files cannot be deleted"
                      : "Delete file"}
                    ariaLabel="Delete file"
                  />
                `
              : null}
            ${isDirty
              ? html`
                  <${ActionButton}
                    onClick=${handleDiscard}
                    disabled=${loading ||
                    !canEditFile ||
                    isEditBlocked ||
                    deleting ||
                    saving}
                    tone="secondary"
                    size="sm"
                    idleLabel="Discard changes"
                    className="file-viewer-save-action"
                  />
                `
              : null}
            <${ActionButton}
              onClick=${handleSave}
              disabled=${loading || !isDirty || !canEditFile || isEditBlocked}
              loading=${saving}
              tone=${isDirty ? "primary" : "secondary"}
              size="sm"
              idleLabel="Save"
              loadingLabel="Saving..."
              idleIcon=${SaveFillIcon}
              idleIconClassName="file-viewer-save-icon"
              className="file-viewer-save-action"
            />
          `
        : null
      : null}
    ${isDiffView && canRestoreDeletedDiff
      ? html`
          <${ActionButton}
            onClick=${onRequestRestore}
            disabled=${restoring}
            loading=${restoring}
            tone="secondary"
            size="sm"
            idleLabel="Restore"
            loadingLabel="Restoring..."
            idleIcon=${RestartLineIcon}
            idleIconClassName="file-viewer-save-icon"
            className="file-viewer-save-action"
          />
        `
      : null}
  </div>
`;
