import { h } from "preact";
import htm from "htm";
import { LoadingSpinner } from "../loading-spinner.js";

const html = htm.bind(h);

const getDiffLineClass = (line) => {
  if (line.startsWith("+") && !line.startsWith("+++")) return "is-added";
  if (line.startsWith("-") && !line.startsWith("---")) return "is-removed";
  if (line.startsWith("@@")) return "is-hunk";
  if (
    line.startsWith("diff ") ||
    line.startsWith("index ") ||
    line.startsWith("--- ") ||
    line.startsWith("+++ ")
  ) {
    return "is-header";
  }
  return "";
};

export const DiffViewer = ({ diffLoading, diffError, diffContent }) => html`
  <div class="file-viewer-diff-shell">
    ${diffLoading
      ? html`
          <div class="file-viewer-loading-shell">
            <${LoadingSpinner} className="h-4 w-4" />
          </div>
        `
      : diffError
        ? html`<div class="file-viewer-state file-viewer-state-error">${diffError}</div>`
        : html`
            <pre class="file-viewer-diff-pre">
${(diffContent || "").split("\n").map((line, lineIndex) => html`
                <div
                  key=${`${lineIndex}:${line.slice(0, 20)}`}
                  class=${`file-viewer-diff-line ${getDiffLineClass(line)}`.trim()}
                >
                  ${line || " "}
                </div>
              `)}
          </pre
            >
          `}
  </div>
`;
