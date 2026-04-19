import { h } from "preact";
import htm from "htm";
import { EditorSurface } from "./editor-surface.js";

const html = htm.bind(h);

export const MarkdownSplitView = ({
  viewMode,
  previewRef,
  handlePreviewScroll,
  previewHtml,
  editorLineNumbers,
  editorLineNumbersRef,
  editorLineNumberRowRefs,
  shouldUseHighlightedEditor,
  highlightedEditorLines,
  editorHighlightRef,
  editorHighlightLineRefs,
  editorTextareaRef,
  renderContent,
  handleContentInput,
  handleEditorKeyDown,
  handleEditorScroll,
  handleEditorSelectionChange,
  isEditBlocked,
  isPreviewOnly,
}) => html`
  <div
    class=${`file-viewer-preview ${viewMode === "preview" ? "" : "file-viewer-pane-hidden"}`}
    ref=${previewRef}
    onscroll=${handlePreviewScroll}
    aria-hidden=${viewMode === "preview" ? "false" : "true"}
    dangerouslySetInnerHTML=${{ __html: previewHtml }}
  ></div>
  <${EditorSurface}
    editorShellClassName=${`file-viewer-editor-shell ${viewMode === "edit" ? "" : "file-viewer-pane-hidden"}`}
    editorShellAriaHidden=${viewMode === "edit" ? "false" : "true"}
    editorLineNumbers=${editorLineNumbers}
    editorLineNumbersRef=${editorLineNumbersRef}
    editorLineNumberRowRefs=${editorLineNumberRowRefs}
    shouldUseHighlightedEditor=${shouldUseHighlightedEditor}
    highlightedEditorLines=${highlightedEditorLines}
    editorHighlightRef=${editorHighlightRef}
    editorHighlightLineRefs=${editorHighlightLineRefs}
    editorTextareaRef=${editorTextareaRef}
    renderContent=${renderContent}
    handleContentInput=${handleContentInput}
    handleEditorKeyDown=${handleEditorKeyDown}
    handleEditorScroll=${handleEditorScroll}
    handleEditorSelectionChange=${handleEditorSelectionChange}
    isEditBlocked=${isEditBlocked}
    isPreviewOnly=${isPreviewOnly}
  />
`;
