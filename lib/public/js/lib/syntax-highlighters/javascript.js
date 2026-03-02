import { escapeHtml } from "./utils.js";

const kJavaScriptKeywordsRegex =
  /\b(await|break|case|catch|class|const|continue|debugger|default|delete|do|else|export|extends|finally|for|from|function|if|import|in|instanceof|let|new|of|return|static|super|switch|this|throw|try|typeof|var|void|while|with|yield)\b/g;

const kNumberRegex =
  /(^|[^\w.])(-?(?:0x[a-fA-F0-9]+|\d+(?:\.\d+)?(?:[eE][+-]?\d+)?))(?=$|[^\w.])/g;

const highlightJavaScriptTextSegment = (text) => {
  let content = escapeHtml(text);
  content = content.replace(kJavaScriptKeywordsRegex, '<span class="hl-keyword">$1</span>');
  content = content.replace(/\b(true|false)\b/g, '<span class="hl-boolean">$1</span>');
  content = content.replace(/\b(null|undefined)\b/g, '<span class="hl-null">$1</span>');
  content = content.replace(kNumberRegex, '$1<span class="hl-number">$2</span>');
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

const tokenizeJavaScriptLine = (line, inBlockComment) => {
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

    const lineCommentIndex = source.indexOf("//", cursor);
    const blockCommentIndex = source.indexOf("/*", cursor);
    const singleQuoteIndex = source.indexOf("'", cursor);
    const doubleQuoteIndex = source.indexOf('"', cursor);
    const templateQuoteIndex = source.indexOf("`", cursor);
    const indexes = [
      lineCommentIndex,
      blockCommentIndex,
      singleQuoteIndex,
      doubleQuoteIndex,
      templateQuoteIndex,
    ].filter((index) => index !== -1);

    if (indexes.length === 0) {
      parts.push({ kind: "text", value: source.slice(cursor) });
      break;
    }

    const nextIndex = Math.min(...indexes);
    if (nextIndex > cursor) {
      parts.push({ kind: "text", value: source.slice(cursor, nextIndex) });
      cursor = nextIndex;
    }

    if (lineCommentIndex === nextIndex) {
      parts.push({ kind: "comment", value: source.slice(nextIndex) });
      break;
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

export const highlightJavaScriptLine = (line, state = { inBlockComment: false }) => {
  const tokens = tokenizeJavaScriptLine(line, Boolean(state?.inBlockComment));
  const html = tokens.parts
    .map((part) => {
      if (part.kind === "comment") {
        return `<span class="hl-comment">${escapeHtml(part.value)}</span>`;
      }
      if (part.kind === "string") {
        return `<span class="hl-string">${escapeHtml(part.value)}</span>`;
      }
      return highlightJavaScriptTextSegment(part.value);
    })
    .join("");
  return {
    html,
    state: { inBlockComment: tokens.inBlockComment },
  };
};

export const highlightJavaScriptContent = (content) => {
  const lines = String(content || "").split("\n");
  let state = { inBlockComment: false };
  return lines.map((line, index) => {
    const renderedLine = highlightJavaScriptLine(line, state);
    state = renderedLine.state;
    return {
      lineNumber: index + 1,
      html: renderedLine.html,
    };
  });
};
