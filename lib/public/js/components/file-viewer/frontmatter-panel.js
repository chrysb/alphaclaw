import { h } from "preact";
import htm from "htm";
import { formatFrontmatterValue } from "../../lib/syntax-highlighters/index.js";

const html = htm.bind(h);

export const FrontmatterPanel = ({
  isMarkdownFile,
  parsedFrontmatter,
  frontmatterCollapsed,
  setFrontmatterCollapsed,
}) => {
  if (!isMarkdownFile || parsedFrontmatter.entries.length <= 0) return null;

  return html`
    <div class="frontmatter-box">
      <button
        type="button"
        class="frontmatter-title"
        onclick=${() => setFrontmatterCollapsed((collapsed) => !collapsed)}
      >
        <span
          class=${`frontmatter-chevron ${frontmatterCollapsed ? "" : "open"}`}
          aria-hidden="true"
        >
          <svg viewBox="0 0 20 20" focusable="false">
            <path d="M7 4l6 6-6 6" />
          </svg>
        </span>
        <span>frontmatter</span>
      </button>
      ${!frontmatterCollapsed
        ? html`
            <div class="frontmatter-grid">
              ${parsedFrontmatter.entries.map((entry) => {
                const formattedValue = formatFrontmatterValue(entry.rawValue);
                const isMultilineValue = formattedValue.includes("\n");
                return html`
                  <div class="frontmatter-row" key=${entry.key}>
                    <div class="frontmatter-key">${entry.key}</div>
                    ${isMultilineValue
                      ? html`
                          <pre class="frontmatter-value frontmatter-value-pre">
${formattedValue}</pre
                          >
                        `
                      : html`<div class="frontmatter-value">${formattedValue}</div>`}
                  </div>
                `;
              })}
            </div>
          `
        : null}
    </div>
  `;
};
