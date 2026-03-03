import { formatFrontmatterValue, parseFrontmatter } from "./frontmatter.js";
import { highlightCssContent } from "./css.js";
import { highlightHtmlContent } from "./html.js";
import { highlightJavaScriptContent } from "./javascript.js";
import { highlightJsonContent } from "./json.js";
import { highlightMarkdownContent } from "./markdown.js";
import { escapeHtml, toLineObjects } from "./utils.js";

export const getFileSyntaxKind = (filePath) => {
  const normalizedPath = String(filePath || "").toLowerCase();
  const pathWithoutBakSuffix = normalizedPath.replace(/(\.bak)+$/i, "");
  if (/\.(md|markdown|mdx)$/i.test(pathWithoutBakSuffix)) return "markdown";
  if (/\.(json|jsonl)$/i.test(pathWithoutBakSuffix)) return "json";
  if (/\.(html|htm)$/i.test(pathWithoutBakSuffix)) return "html";
  if (/\.(js|mjs|cjs)$/i.test(pathWithoutBakSuffix)) return "javascript";
  if (/\.(css|scss)$/i.test(pathWithoutBakSuffix)) return "css";
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
