import { escapeHtml, toLineObjects } from "./utils.js";

const tokenizeJsonLine = (line) => {
  const parts = [];
  const source = String(line || "");
  const stringRegex = /"([^"\\]|\\.)*"/g;
  let lastIndex = 0;
  let match = stringRegex.exec(source);

  while (match) {
    const start = match.index;
    const end = stringRegex.lastIndex;
    const value = match[0];
    const trailing = source.slice(end);
    const isKey = /^\s*:/.test(trailing);

    if (start > lastIndex) {
      parts.push({ kind: "text", value: source.slice(lastIndex, start) });
    }
    parts.push({ kind: isKey ? "key" : "string", value });
    lastIndex = end;
    match = stringRegex.exec(source);
  }

  if (lastIndex < source.length) {
    parts.push({ kind: "text", value: source.slice(lastIndex) });
  }

  if (parts.length === 0) {
    return [{ kind: "text", value: source }];
  }
  return parts;
};

const highlightJsonTextSegment = (text) => {
  let content = escapeHtml(text);
  content = content.replace(
    /(^|[^\w.])(-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?)(?=$|[^\w.])/g,
    '$1<span class="hl-number">$2</span>',
  );
  content = content.replace(/\b(true|false)\b/g, '<span class="hl-boolean">$1</span>');
  content = content.replace(/\bnull\b/g, '<span class="hl-null">null</span>');
  content = content.replace(/([{}\[\],:])/g, '<span class="hl-punc">$1</span>');
  return content;
};

const renderHighlightedJsonLine = (line) =>
  tokenizeJsonLine(line)
    .map((part) => {
      if (part.kind === "key") {
        return `<span class="hl-key">${escapeHtml(part.value)}</span>`;
      }
      if (part.kind === "string") {
        return `<span class="hl-string">${escapeHtml(part.value)}</span>`;
      }
      return highlightJsonTextSegment(part.value);
    })
    .join("");

export const highlightJsonContent = (content) =>
  toLineObjects(content, renderHighlightedJsonLine);
