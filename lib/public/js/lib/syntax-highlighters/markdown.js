import { escapeHtml, toLineObjects } from "./utils.js";

const renderInlineMarkdown = (line) => {
  let content = escapeHtml(line);
  content = content.replace(/`([^`]+)`/g, '<span class="hl-string">`$1`</span>');
  content = content.replace(/\*\*([^*]+)\*\*/g, '<span class="hl-bold">**$1**</span>');
  content = content.replace(
    /\[([^\]]+)\]\(([^)]+)\)/g,
    '<span class="hl-link">[$1]($2)</span>',
  );
  return content;
};

const renderHighlightedMarkdownLine = (line) => {
  if (/^#{1,6}\s/.test(line)) {
    return `<span class="hl-heading">${escapeHtml(line)}</span>`;
  }
  if (/^>\s/.test(line)) {
    return `<span class="hl-comment">${escapeHtml(line)}</span>`;
  }
  if (/^```/.test(line)) {
    return `<span class="hl-meta">${escapeHtml(line)}</span>`;
  }
  if (/^\|[-\s|]+\|$/.test(line)) {
    return `<span class="hl-meta">${escapeHtml(line)}</span>`;
  }
  if (/^\s*[-*]\s/.test(line)) {
    return renderInlineMarkdown(line).replace(
      /^(\s*)([-*])/,
      '$1<span class="hl-bullet">$2</span>',
    );
  }
  return renderInlineMarkdown(line);
};

export const highlightMarkdownContent = (content) =>
  toLineObjects(content, renderHighlightedMarkdownLine);
