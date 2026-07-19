import { describe, expect, it } from "vitest";
import { highlightMarkdownContent } from "../../lib/public/js/lib/syntax-highlighters/markdown.js";
import {
  getFileSyntaxKind,
  highlightEditorLines,
} from "../../lib/public/js/lib/syntax-highlighters/index.js";

const htmlForLine = (content) => highlightMarkdownContent(content)[0].html;

describe("frontend/syntax-highlighters markdown", () => {
  it("highlights headings, quotes, fences, and table separators", () => {
    expect(htmlForLine("# Title")).toBe(
      '<span class="hl-heading"># Title</span>',
    );
    expect(htmlForLine("### Deep <b>")).toBe(
      '<span class="hl-heading">### Deep &lt;b&gt;</span>',
    );
    expect(htmlForLine("> quoted text")).toBe(
      '<span class="hl-comment">&gt; quoted text</span>',
    );
    expect(htmlForLine("```js")).toBe('<span class="hl-meta">```js</span>');
    expect(htmlForLine("|---|---|")).toBe(
      '<span class="hl-meta">|---|---|</span>',
    );
  });

  it("highlights bullets with inline markdown", () => {
    expect(htmlForLine("- item")).toBe('<span class="hl-bullet">-</span> item');
    expect(htmlForLine("  * starred")).toBe(
      '  <span class="hl-bullet">*</span> starred',
    );
    expect(htmlForLine("- has `code`")).toContain(
      '<span class="hl-string">`code`</span>',
    );
  });

  it("highlights inline code, bold, and links on plain lines", () => {
    const html = htmlForLine("say `hi` to **you** via [site](https://x.dev)");
    expect(html).toContain('<span class="hl-string">`hi`</span>');
    expect(html).toContain('<span class="hl-bold">**you**</span>');
    expect(html).toContain(
      '<span class="hl-link">[site](https://x.dev)</span>',
    );
  });

  it("escapes plain lines and keeps line numbering", () => {
    const lines = highlightMarkdownContent("plain <tag>\nsecond & line");
    expect(lines).toHaveLength(2);
    expect(lines[0]).toEqual({ lineNumber: 1, html: "plain &lt;tag&gt;" });
    expect(lines[1]).toEqual({ lineNumber: 2, html: "second &amp; line" });
  });
});

describe("frontend/syntax-highlighters editor line dispatch", () => {
  it("falls back to plain for unknown extensions", () => {
    expect(getFileSyntaxKind("notes/file.txt")).toBe("plain");
    expect(getFileSyntaxKind("")).toBe("plain");
  });

  it("routes each syntax kind to its highlighter", () => {
    expect(highlightEditorLines("# hi", "markdown")[0].html).toBe(
      '<span class="hl-heading"># hi</span>',
    );
    expect(
      highlightEditorLines("const x = 1;", "javascript")[0].html,
    ).toContain("hl-");
    expect(highlightEditorLines("a { color: red; }", "css")[0].html).toContain(
      "hl-",
    );
    expect(highlightEditorLines("x < y", "plain")).toEqual([
      { lineNumber: 1, html: "x &lt; y" },
    ]);
    expect(highlightEditorLines("x < y", "unknown-kind")).toEqual([
      { lineNumber: 1, html: "x &lt; y" },
    ]);
  });
});
