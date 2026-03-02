import { formatFrontmatterValue, parseFrontmatter } from "./frontmatter.js";
import { highlightCssContent } from "./css.js";
import { highlightHtmlContent } from "./html.js";
import { highlightJavaScriptContent } from "./javascript.js";
import { highlightJsonContent } from "./json.js";
import { highlightMarkdownContent } from "./markdown.js";
import { escapeHtml, toLineObjects } from "./utils.js";

export const getFileSyntaxKind = (filePath) => {
  const normalizedPath = String(filePath || "").toLowerCase();
  if (/\.(md|markdown|mdx)$/i.test(normalizedPath)) return "markdown";
  if (/\.(json|jsonl)$/i.test(normalizedPath)) return "json";
  if (/\.(html|htm)$/i.test(normalizedPath)) return "html";
  if (/\.(js|mjs|cjs)$/i.test(normalizedPath)) return "javascript";
  if (/\.(css|scss)$/i.test(normalizedPath)) return "css";
  return "plain";
};

export const highlightEditorLines = (content, syntaxKind) => {
  if (syntaxKind === "markdown") return highlightMarkdownContent(content);
  if (syntaxKind === "json") return highlightJsonContent(content);
  if (syntaxKind === "html") return highlightHtmlContent(content);
  if (syntaxKind === "javascript") return highlightJavaScriptContent(content);
  if (syntaxKind === "css") return highlightCssContent(content);
  return toLineObjects(content, (line) => escapeHtml(line));
};

export { formatFrontmatterValue, parseFrontmatter };
