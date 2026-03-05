import { h } from "https://esm.sh/preact";
import { useState } from "https://esm.sh/preact/hooks";
import htm from "https://esm.sh/htm";
import { LoadingSpinner } from "../loading-spinner.js";
import { ConfirmDialog } from "../confirm-dialog.js";
import { SqliteViewer } from "./sqlite-viewer.js";
import { FileViewerToolbar } from "./toolbar.js";
import { FileViewerStatusBanners } from "./status-banners.js";
import { FrontmatterPanel } from "./frontmatter-panel.js";
import { DiffViewer } from "./diff-viewer.js";
import { MediaPreview } from "./media-preview.js";
import { EditorSurface } from "./editor-surface.js";
import { MarkdownSplitView } from "./markdown-split-view.js";
import { kSqlitePageSize } from "./constants.js";
import { useFileViewer } from "./use-file-viewer.js";

const html = htm.bind(h);

export const FileViewer = ({
  filePath = "",
  isPreviewOnly = false,
  browseView = "edit",
  onRequestEdit = () => {},
  onRequestClearSelection = () => {},
}) => {
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const { state, derived, refs, actions, context } = useFileViewer({
    filePath,
    isPreviewOnly,
    browseView,
    onRequestClearSelection,
    onRequestEdit,
  });

  if (!state.hasSelectedPath || state.isFolderPath) {
    return html`
      <div class="file-viewer-empty">
        <div class="file-viewer-empty-mark">[ ]</div>
        <div class="file-viewer-empty-title">Browse and edit files<br />Syncs to git</div>
      </div>
    `;
  }

  return html`
    <div class="file-viewer">
      <${FileViewerToolbar}
        pathSegments=${derived.pathSegments}
        isDirty=${derived.isDirty}
        isPreviewOnly=${state.isPreviewOnly}
        isDiffView=${state.isDiffView}
        isMarkdownFile=${state.isMarkdownFile}
        viewMode=${state.viewMode}
        handleChangeViewMode=${actions.handleChangeViewMode}
        handleSave=${actions.handleSave}
        handleDiscard=${actions.handleDiscard}
        loading=${state.loading}
        canEditFile=${derived.canEditFile}
        isEditBlocked=${derived.isEditBlocked}
        isImageFile=${state.isImageFile}
        isAudioFile=${state.isAudioFile}
        isSqliteFile=${state.isSqliteFile}
        saving=${state.saving}
        deleting=${state.deleting}
        restoring=${state.restoring}
        canDeleteFile=${derived.canDeleteFile}
        isDeleteBlocked=${derived.isDeleteBlocked}
        isProtectedFile=${derived.isProtectedFile}
        canRestoreDeletedDiff=${state.isDiffView && !!state.diffStatus?.isDeleted}
        onRequestDelete=${() => setDeleteConfirmOpen(true)}
        onRequestRestore=${actions.handleRestore}
      />
      <${FileViewerStatusBanners}
        isDiffView=${state.isDiffView}
        onRequestEdit=${onRequestEdit}
        normalizedPath=${context.normalizedPath}
        isDeletedDiff=${!!state.diffStatus?.isDeleted}
        isLockedFile=${derived.isLockedFile}
        isProtectedFile=${derived.isProtectedFile}
        isProtectedLocked=${derived.isProtectedLocked}
        handleEditProtectedFile=${actions.handleEditProtectedFile}
      />
      ${!state.isDiffView
        ? html`
            <${FrontmatterPanel}
              isMarkdownFile=${state.isMarkdownFile}
              parsedFrontmatter=${derived.parsedFrontmatter}
              frontmatterCollapsed=${state.frontmatterCollapsed}
              setFrontmatterCollapsed=${actions.setFrontmatterCollapsed}
            />
          `
        : null}
      ${state.loading
        ? html`
            <div class="file-viewer-loading-shell">
              ${state.showDelayedLoadingSpinner
                ? html`<${LoadingSpinner} className="h-4 w-4" />`
                : null}
            </div>
          `
        : state.error
          ? html`<div class="file-viewer-state file-viewer-state-error">${state.error}</div>`
          : state.isImageFile || state.isAudioFile
              ? html`
                  <${MediaPreview}
                    isImageFile=${state.isImageFile}
                    imageDataUrl=${state.imageDataUrl}
                    pathSegments=${derived.pathSegments}
                    isAudioFile=${state.isAudioFile}
                    audioDataUrl=${state.audioDataUrl}
                  />
                `
              : state.isSqliteFile
                ? html`
                    <${SqliteViewer}
                      sqliteSummary=${state.sqliteSummary}
                      sqliteSelectedTable=${state.sqliteSelectedTable}
                      setSqliteSelectedTable=${actions.setSqliteSelectedTable}
                      sqliteTableOffset=${state.sqliteTableOffset}
                      setSqliteTableOffset=${actions.setSqliteTableOffset}
                      sqliteTableLoading=${state.sqliteTableLoading}
                      sqliteTableError=${state.sqliteTableError}
                      sqliteTableData=${state.sqliteTableData}
                      kSqlitePageSize=${kSqlitePageSize}
                    />
                  `
                : state.isDiffView
                  ? html`
                      <${DiffViewer}
                        diffLoading=${state.diffLoading}
                        diffError=${state.diffError}
                        diffContent=${state.diffContent}
                      />
                    `
                  : html`
                      ${state.isMarkdownFile
                        ? html`
                            <${MarkdownSplitView}
                              viewMode=${state.viewMode}
                              previewRef=${refs.previewRef}
                              handlePreviewScroll=${actions.handlePreviewScroll}
                              previewHtml=${state.previewHtml}
                              editorLineNumbers=${derived.editorLineNumbers}
                              editorLineNumbersRef=${refs.editorLineNumbersRef}
                              editorLineNumberRowRefs=${refs.editorLineNumberRowRefs}
                              highlightedEditorLines=${derived.highlightedEditorLines}
                              editorHighlightRef=${refs.editorHighlightRef}
                              editorHighlightLineRefs=${refs.editorHighlightLineRefs}
                              editorTextareaRef=${refs.editorTextareaRef}
                              renderContent=${state.renderContent}
                              handleContentInput=${actions.handleContentInput}
                              handleEditorKeyDown=${actions.handleEditorKeyDown}
                              handleEditorScroll=${actions.handleEditorScroll}
                              handleEditorSelectionChange=${actions.handleEditorSelectionChange}
                              isEditBlocked=${derived.isEditBlocked}
                              isPreviewOnly=${state.isPreviewOnly}
                            />
                          `
                        : html`
                            <${EditorSurface}
                              editorLineNumbers=${derived.editorLineNumbers}
                              editorLineNumbersRef=${refs.editorLineNumbersRef}
                              editorLineNumberRowRefs=${refs.editorLineNumberRowRefs}
                              shouldUseHighlightedEditor=${derived.shouldUseHighlightedEditor}
                              highlightedEditorLines=${derived.highlightedEditorLines}
                              editorHighlightRef=${refs.editorHighlightRef}
                              editorHighlightLineRefs=${refs.editorHighlightLineRefs}
                              editorTextareaRef=${refs.editorTextareaRef}
                              renderContent=${state.renderContent}
                              handleContentInput=${actions.handleContentInput}
                              handleEditorKeyDown=${actions.handleEditorKeyDown}
                              handleEditorScroll=${actions.handleEditorScroll}
                              handleEditorSelectionChange=${actions.handleEditorSelectionChange}
                              isEditBlocked=${derived.isEditBlocked}
                              isPreviewOnly=${state.isPreviewOnly}
                            />
                          `}
                    `}
      <${ConfirmDialog}
        visible=${deleteConfirmOpen}
        title="Delete file?"
        message=${`Delete ${context.normalizedPath || "this file"}? This can be restored from diff view before sync.`}
        confirmLabel="Delete"
        confirmLoadingLabel="Deleting..."
        cancelLabel="Cancel"
        confirmTone="warning"
        confirmLoading=${state.deleting}
        confirmDisabled=${!derived.canDeleteFile || state.deleting}
        onCancel=${() => {
          if (state.deleting) return;
          setDeleteConfirmOpen(false);
        }}
        onConfirm=${async () => {
          await actions.handleDelete();
          setDeleteConfirmOpen(false);
        }}
      />
    </div>
  `;
};
