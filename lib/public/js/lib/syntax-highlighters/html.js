import { escapeHtml } from "./utils.js";
import { highlightCssLine } from "./css.js";
import { highlightJavaScriptLine } from "./javascript.js";

const highlightHtmlTextSegment = (text) =>
  escapeHtml(text).replace(
    /(&[a-zA-Z][a-zA-Z0-9]+;|&#\d+;|&#x[0-9a-fA-F]+;)/g,
    '<span class="hl-entity">$1</span>',
  );

const highlightHtmlAttributeValue = (valueWithSpace) => {
  const leadingWhitespace = valueWithSpace.match(/^\s*/)?.[0] || "";
  const rawValue = valueWithSpace.slice(leadingWhitespace.length);
  return `${escapeHtml(leadingWhitespace)}<span class="hl-string">${escapeHtml(rawValue)}</span>`;
};

const highlightHtmlAttributes = (attributesText) => {
  const attrRegex = /([:@A-Za-z_][\w:.-]*)(\s*=\s*(?:"[^"]*"|'[^']*'|[^\s"'=<>`]+))?/g;
  let html = "";
  let cursor = 0;
  let match = attrRegex.exec(attributesText);

  while (match) {
    const fullMatch = match[0];
    const attrName = match[1];
    const attrAssignment = match[2] || "";
    const start = match.index;
    const end = start + fullMatch.length;

    if (start > cursor) {
      html += escapeHtml(attributesText.slice(cursor, start));
    }
    html += `<span class="hl-attr">${escapeHtml(attrName)}</span>`;

    if (attrAssignment) {
      const equalsIndex = attrAssignment.indexOf("=");
      if (equalsIndex !== -1) {
        const beforeEquals = attrAssignment.slice(0, equalsIndex);
        const afterEquals = attrAssignment.slice(equalsIndex + 1);
        html += `${escapeHtml(beforeEquals)}<span class="hl-punc">=</span>${highlightHtmlAttributeValue(afterEquals)}`;
      } else {
        html += escapeHtml(attrAssignment);
      }
    }

    cursor = end;
    match = attrRegex.exec(attributesText);
  }

  if (cursor < attributesText.length) {
    html += escapeHtml(attributesText.slice(cursor));
  }
  return html;
};

const renderHighlightedHtmlTag = (tagText) => {
  if (/^<!--[\s\S]*-->$/.test(tagText) || /^<!DOCTYPE/i.test(tagText)) {
    return `<span class="hl-meta">${escapeHtml(tagText)}</span>`;
  }

  const tagMatch = tagText.match(/^<\s*(\/?)\s*([A-Za-z][\w:-]*)([\s\S]*?)(\/?)\s*>$/);
  if (!tagMatch) {
    return `<span class="hl-tag">${escapeHtml(tagText)}</span>`;
  }

  const isClosing = tagMatch[1] === "/";
  const tagName = tagMatch[2];
  const attributesText = tagMatch[3] || "";
  const isSelfClosing = tagMatch[4] === "/";
  const open = isClosing ? "&lt;/" : "&lt;";
  const attrsHtml = isClosing ? "" : highlightHtmlAttributes(attributesText);
  const close = isSelfClosing ? "/&gt;" : "&gt;";

  return `<span class="hl-punc">${open}</span><span class="hl-tag">${escapeHtml(tagName)}</span>${attrsHtml}<span class="hl-punc">${close}</span>`;
};

const renderHighlightedHtmlLine = (line) => {
  const tokenRegex = /<!--[\s\S]*?-->|<!DOCTYPE[^>]*>|<\/?[A-Za-z][^>]*>/gi;
  const source = String(line || "");
  let html = "";
  let cursor = 0;
  let match = tokenRegex.exec(source);

  while (match) {
    const token = match[0];
    const start = match.index;
    const end = start + token.length;
    if (start > cursor) {
      html += highlightHtmlTextSegment(source.slice(cursor, start));
    }
    html += renderHighlightedHtmlTag(token);
    cursor = end;
    match = tokenRegex.exec(source);
  }

  if (cursor < source.length) {
    html += highlightHtmlTextSegment(source.slice(cursor));
  }
  return html;
};

const findNextTag = (source, tagName) => {
  const regex = new RegExp(`<\\/?\\s*${tagName}\\b[^>]*>`, "ig");
  const match = regex.exec(source);
  if (!match) return null;
  return {
    text: match[0],
    start: match.index,
    end: match.index + match[0].length,
    isClosing: /^<\s*\//.test(match[0]),
  };
};

const highlightInlineSection = (line, state) => {
  let html = "";
  let cursor = 0;
  let nextMode = state.mode;
  let nextLanguageState = state.languageState;

  while (cursor < line.length) {
    if (nextMode === "script") {
      const closeTag = findNextTag(line.slice(cursor), "script");
      if (!closeTag || !closeTag.isClosing) {
        const renderedJs = highlightJavaScriptLine(line.slice(cursor), nextLanguageState);
        html += renderedJs.html;
        nextLanguageState = renderedJs.state;
        cursor = line.length;
        break;
      }
      const absoluteCloseStart = cursor + closeTag.start;
      const absoluteCloseEnd = cursor + closeTag.end;
      const jsPart = line.slice(cursor, absoluteCloseStart);
      const renderedJs = highlightJavaScriptLine(jsPart, nextLanguageState);
      html += renderedJs.html;
      html += renderHighlightedHtmlLine(line.slice(absoluteCloseStart, absoluteCloseEnd));
      nextMode = "html";
      nextLanguageState = { inBlockComment: false };
      cursor = absoluteCloseEnd;
      continue;
    }

    if (nextMode === "style") {
      const closeTag = findNextTag(line.slice(cursor), "style");
      if (!closeTag || !closeTag.isClosing) {
        const renderedCss = highlightCssLine(line.slice(cursor), nextLanguageState);
        html += renderedCss.html;
        nextLanguageState = renderedCss.state;
        cursor = line.length;
        break;
      }
      const absoluteCloseStart = cursor + closeTag.start;
      const absoluteCloseEnd = cursor + closeTag.end;
      const cssPart = line.slice(cursor, absoluteCloseStart);
      const renderedCss = highlightCssLine(cssPart, nextLanguageState);
      html += renderedCss.html;
      html += renderHighlightedHtmlLine(line.slice(absoluteCloseStart, absoluteCloseEnd));
      nextMode = "html";
      nextLanguageState = { inBlockComment: false };
      cursor = absoluteCloseEnd;
      continue;
    }

    const remaining = line.slice(cursor);
    const nextScript = findNextTag(remaining, "script");
    const nextStyle = findNextTag(remaining, "style");
    const candidates = [nextScript, nextStyle]
      .filter((candidate) => candidate && !candidate.isClosing)
      .sort((left, right) => left.start - right.start);

    if (candidates.length === 0) {
      html += renderHighlightedHtmlLine(remaining);
      cursor = line.length;
      break;
    }

    const nextTag = candidates[0];
    const absoluteTagStart = cursor + nextTag.start;
    const absoluteTagEnd = cursor + nextTag.end;
    html += renderHighlightedHtmlLine(line.slice(cursor, absoluteTagStart));
    html += renderHighlightedHtmlLine(line.slice(absoluteTagStart, absoluteTagEnd));
    nextMode = /<\s*script\b/i.test(nextTag.text) ? "script" : "style";
    nextLanguageState = { inBlockComment: false };
    cursor = absoluteTagEnd;
  }

  return {
    html,
    state: {
      mode: nextMode,
      languageState: nextLanguageState,
    },
  };
};

export const highlightHtmlContent = (content) => {
  const lines = String(content || "").split("\n");
  let state = {
    mode: "html",
    languageState: { inBlockComment: false },
  };
  return lines.map((line, index) => {
    const renderedLine = highlightInlineSection(line, state);
    state = renderedLine.state;
    return {
      lineNumber: index + 1,
      html: renderedLine.html,
    };
  });
};
