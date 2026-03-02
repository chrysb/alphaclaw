import { escapeHtml } from "./utils.js";

const kCssNumberRegex =
  /(^|[^\w.#-])(-?\d+(?:\.\d+)?(?:px|em|rem|vh|vw|%|deg|s|ms)?)(?=$|[^\w-])/g;

const highlightCssTextSegment = (text) => {
  let content = escapeHtml(text);
  content = content.replace(/@[a-zA-Z-]+/g, '<span class="hl-keyword">$&</span>');
  content = content.replace(/#[0-9a-fA-F]{3,8}\b/g, '<span class="hl-number">$&</span>');
  content = content.replace(kCssNumberRegex, '$1<span class="hl-number">$2</span>');
  content = content.replace(
    /(^|[;{\s])([a-zA-Z-]+)(\s*:)/g,
    '$1<span class="hl-attr">$2</span>$3',
  );
  return content;
};

const findClosingQuote = (source, startIndex, quote) => {
  let index = startIndex + 1;
  while (index < source.length) {
    if (source[index] === "\\" && index + 1 < source.length) {
      index += 2;
      continue;
    }
    if (source[index] === quote) return index;
    index += 1;
  }
  return -1;
};

const tokenizeCssLine = (line, inBlockComment) => {
  const source = String(line || "");
  const parts = [];
  let cursor = 0;
  let nextInBlockComment = inBlockComment;

  while (cursor < source.length) {
    if (nextInBlockComment) {
      const blockEnd = source.indexOf("*/", cursor);
      if (blockEnd === -1) {
        parts.push({ kind: "comment", value: source.slice(cursor) });
        return { parts, inBlockComment: true };
      }
      parts.push({ kind: "comment", value: source.slice(cursor, blockEnd + 2) });
      cursor = blockEnd + 2;
      nextInBlockComment = false;
      continue;
    }

    const blockCommentIndex = source.indexOf("/*", cursor);
    const singleQuoteIndex = source.indexOf("'", cursor);
    const doubleQuoteIndex = source.indexOf('"', cursor);
    const indexes = [blockCommentIndex, singleQuoteIndex, doubleQuoteIndex].filter(
      (index) => index !== -1,
    );

    if (indexes.length === 0) {
      parts.push({ kind: "text", value: source.slice(cursor) });
      break;
    }

    const nextIndex = Math.min(...indexes);
    if (nextIndex > cursor) {
      parts.push({ kind: "text", value: source.slice(cursor, nextIndex) });
      cursor = nextIndex;
    }

    if (blockCommentIndex === nextIndex) {
      const blockEnd = source.indexOf("*/", nextIndex + 2);
      if (blockEnd === -1) {
        parts.push({ kind: "comment", value: source.slice(nextIndex) });
        nextInBlockComment = true;
        break;
      }
      parts.push({ kind: "comment", value: source.slice(nextIndex, blockEnd + 2) });
      cursor = blockEnd + 2;
      continue;
    }

    const quote = source[nextIndex];
    const quoteEnd = findClosingQuote(source, nextIndex, quote);
    if (quoteEnd === -1) {
      parts.push({ kind: "string", value: source.slice(nextIndex) });
      break;
    }
    parts.push({ kind: "string", value: source.slice(nextIndex, quoteEnd + 1) });
    cursor = quoteEnd + 1;
  }

  return { parts, inBlockComment: nextInBlockComment };
};

export const highlightCssLine = (line, state = { inBlockComment: false }) => {
  const tokens = tokenizeCssLine(line, Boolean(state?.inBlockComment));
  const html = tokens.parts
    .map((part) => {
      if (part.kind === "comment") {
        return `<span class="hl-comment">${escapeHtml(part.value)}</span>`;
      }
      if (part.kind === "string") {
        return `<span class="hl-string">${escapeHtml(part.value)}</span>`;
      }
      return highlightCssTextSegment(part.value);
    })
    .join("");

  return {
    html,
    state: { inBlockComment: tokens.inBlockComment },
  };
};

export const highlightCssContent = (content) => {
  const lines = String(content || "").split("\n");
  let state = { inBlockComment: false };
  return lines.map((line, index) => {
    const renderedLine = highlightCssLine(line, state);
    state = renderedLine.state;
    return {
      lineNumber: index + 1,
      html: renderedLine.html,
    };
  });
};
