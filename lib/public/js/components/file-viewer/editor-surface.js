import { h } from "https://esm.sh/preact";
import htm from "https://esm.sh/htm";

const html = htm.bind(h);

const EditorTextarea = ({
  overlay = false,
  editorTextareaRef,
  renderContent,
  handleContentInput,
  handleEditorKeyDown,
  handleEditorScroll,
  handleEditorSelectionChange,
  isEditBlocked,
  isPreviewOnly,
  textareaWrap = "soft",
}) => html`
  <textarea
    class=${overlay ? "file-viewer-editor file-viewer-editor-overlay" : "file-viewer-editor"}
    ref=${editorTextareaRef}
    value=${renderContent}
    onInput=${handleContentInput}
    onKeyDown=${handleEditorKeyDown}
    onScroll=${handleEditorScroll}
    onSelect=${handleEditorSelectionChange}
    onKeyUp=${handleEditorSelectionChange}
    onClick=${handleEditorSelectionChange}
    disabled=${isEditBlocked || isPreviewOnly}
    readonly=${isEditBlocked || isPreviewOnly}
    spellcheck=${false}
    autocorrect="off"
    autocapitalize="off"
    autocomplete="off"
    data-gramm="false"
    data-gramm_editor="false"
    data-enable-grammarly="false"
    wrap=${textareaWrap}
  ></textarea>
`;

export const EditorSurface = ({
  editorShellClassName = "file-viewer-editor-shell",
  editorShellAriaHidden,
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
  textareaWrap = "soft",
}) => html`
  <div class=${editorShellClassName} aria-hidden=${editorShellAriaHidden}>
    <div class="file-viewer-editor-line-num-col" ref=${editorLineNumbersRef}>
      ${editorLineNumbers.map(
        (lineNumber) => html`
          <div
            class="file-viewer-editor-line-num"
            key=${lineNumber}
            data-line-row
            ref=${(element) => {
              editorLineNumberRowRefs.current[lineNumber - 1] = element;
            }}
          >
            ${lineNumber}
          </div>
        `,
      )}
    </div>
    ${shouldUseHighlightedEditor
      ? html`
          <div class="file-viewer-editor-stack">
            <div class="file-viewer-editor-highlight" ref=${editorHighlightRef}>
              ${highlightedEditorLines.map(
                (line) => html`
                  <div
                    class="file-viewer-editor-highlight-line"
                    key=${line.lineNumber}
                    ref=${(element) => {
                      editorHighlightLineRefs.current[line.lineNumber - 1] = element;
                    }}
                  >
                    <span
                      class="file-viewer-editor-highlight-line-content"
                      dangerouslySetInnerHTML=${{
                        __html: line.html,
                      }}
                    ></span>
                  </div>
                `,
              )}
            </div>
            <${EditorTextarea}
              overlay=${true}
              editorTextareaRef=${editorTextareaRef}
              renderContent=${renderContent}
              handleContentInput=${handleContentInput}
              handleEditorKeyDown=${handleEditorKeyDown}
              handleEditorScroll=${handleEditorScroll}
              handleEditorSelectionChange=${handleEditorSelectionChange}
              isEditBlocked=${isEditBlocked}
              isPreviewOnly=${isPreviewOnly}
              textareaWrap=${textareaWrap}
            />
          </div>
        `
      : html`
          <${EditorTextarea}
            overlay=${false}
            editorTextareaRef=${editorTextareaRef}
            renderContent=${renderContent}
            handleContentInput=${handleContentInput}
            handleEditorKeyDown=${handleEditorKeyDown}
            handleEditorScroll=${handleEditorScroll}
            handleEditorSelectionChange=${handleEditorSelectionChange}
            isEditBlocked=${isEditBlocked}
            isPreviewOnly=${isPreviewOnly}
            textareaWrap=${textareaWrap}
          />
        `}
  </div>
`;
