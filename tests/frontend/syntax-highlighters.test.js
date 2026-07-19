const loadSyntaxHighlighters = async () =>
  import("../../lib/public/js/lib/syntax-highlighters/index.js");

describe("frontend/syntax-highlighters", () => {
  it("maps file extensions to expected syntax kinds", async () => {
    const { getFileSyntaxKind } = await loadSyntaxHighlighters();

    expect(getFileSyntaxKind("notes/readme.md")).toBe("markdown");
    expect(getFileSyntaxKind("logs/events.jsonl")).toBe("json");
    expect(getFileSyntaxKind("src/index.mjs")).toBe("javascript");
    expect(getFileSyntaxKind("styles/app.scss")).toBe("css");
    expect(getFileSyntaxKind("pages/home.html")).toBe("html");
  });

  it("keeps dashed JSON keys and values intact", async () => {
    const { highlightEditorLines } = await loadSyntaxHighlighters();
    const lines = highlightEditorLines('{"my-key":"value-with-dash"}', "json");

    expect(lines).toHaveLength(1);
    expect(lines[0].html).toContain('<span class="hl-key">"my-key"</span>');
    expect(lines[0].html).toContain('<span class="hl-string">"value-with-dash"</span>');
    expect(lines[0].html).not.toContain("<span class=\"hl-key\">\"my</span>");
    expect(lines[0].html).not.toContain("<span class=\"hl-string\">\"value</span>");
  });

  it("highlights inline css/js inside html blocks", async () => {
    const { highlightEditorLines } = await loadSyntaxHighlighters();
    const lines = highlightEditorLines(
      [
        "<style>body { color: red; }</style>",
        "<script>const count = 1;</script>",
      ].join("\n"),
      "html",
    );

    expect(lines[0].html).toContain('<span class="hl-tag">style</span>');
    expect(lines[0].html).toContain('<span class="hl-attr">color</span>');
    expect(lines[1].html).toContain('<span class="hl-tag">script</span>');
    expect(lines[1].html).toContain('<span class="hl-keyword">const</span>');
  });
});

const loadJavaScriptHighlighter = async () =>
  import("../../lib/public/js/lib/syntax-highlighters/javascript.js");
const loadCssHighlighter = async () =>
  import("../../lib/public/js/lib/syntax-highlighters/css.js");
const loadHtmlHighlighter = async () =>
  import("../../lib/public/js/lib/syntax-highlighters/html.js");
const loadFrontmatter = async () =>
  import("../../lib/public/js/lib/syntax-highlighters/frontmatter.js");

describe("frontend/syntax-highlighters/javascript", () => {
  it("highlights keywords, literals, numbers, strings, and comments", async () => {
    const { highlightJavaScriptContent } = await loadJavaScriptHighlighter();
    const lines = highlightJavaScriptContent(
      [
        "const x = 42; // trailing comment",
        "let flag = true; const nothing = null; let missing = undefined; let off = false;",
        "const hex = 0xFF; const exp = 1.5e10; const neg = -7;",
        'const dq = "double \\" quote";',
        "const sq = 'single';",
        "const tpl = `template`;",
        "before /* inline */ typeof after",
      ].join("\n"),
    );

    expect(lines).toHaveLength(7);
    expect(lines[0].html).toContain('<span class="hl-keyword">const</span>');
    expect(lines[0].html).toContain('<span class="hl-number">42</span>');
    expect(lines[0].html).toContain('<span class="hl-comment">// trailing comment</span>');
    expect(lines[1].html).toContain('<span class="hl-boolean">true</span>');
    expect(lines[1].html).toContain('<span class="hl-boolean">false</span>');
    expect(lines[1].html).toContain('<span class="hl-null">null</span>');
    expect(lines[1].html).toContain('<span class="hl-null">undefined</span>');
    expect(lines[2].html).toContain('<span class="hl-number">0xFF</span>');
    expect(lines[2].html).toContain('<span class="hl-number">1.5e10</span>');
    expect(lines[2].html).toContain('<span class="hl-number">-7</span>');
    expect(lines[3].html).toContain('<span class="hl-string">"double \\" quote"</span>');
    expect(lines[4].html).toContain("<span class=\"hl-string\">'single'</span>");
    expect(lines[5].html).toContain('<span class="hl-string">`template`</span>');
    expect(lines[6].html).toContain('<span class="hl-comment">/* inline */</span>');
    expect(lines[6].html).toContain('<span class="hl-keyword">typeof</span>');
  });

  it("tracks block comments across lines and unterminated tokens", async () => {
    const { highlightJavaScriptContent } = await loadJavaScriptHighlighter();
    const lines = highlightJavaScriptContent(
      [
        "start /* spans",
        "middle of comment",
        "end */ return this;",
        "plain text line",
        'const open = "unterminated',
        "/* never closed",
      ].join("\n"),
    );

    expect(lines[0].html).toContain('<span class="hl-comment">/* spans</span>');
    expect(lines[1].html).toBe('<span class="hl-comment">middle of comment</span>');
    expect(lines[2].html).toContain('<span class="hl-comment">end */</span>');
    expect(lines[2].html).toContain('<span class="hl-keyword">return</span>');
    expect(lines[2].html).toContain('<span class="hl-keyword">this</span>');
    expect(lines[3].html).toContain("plain text line");
    expect(lines[4].html).toContain('<span class="hl-string">"unterminated</span>');
    expect(lines[5].html).toBe('<span class="hl-comment">/* never closed</span>');
  });

  it("handles escaped closing quotes at line end and default state", async () => {
    const { highlightJavaScriptLine, highlightJavaScriptContent } =
      await loadJavaScriptHighlighter();

    const rendered = highlightJavaScriptLine("const a = 1");
    expect(rendered.html).toContain('<span class="hl-keyword">const</span>');
    expect(rendered.state).toEqual({ inBlockComment: false });

    const trailingEscape = highlightJavaScriptLine('const s = "abc\\');
    expect(trailingEscape.html).toContain('class="hl-string"');

    expect(highlightJavaScriptContent("")).toEqual([{ lineNumber: 1, html: "" }]);
    expect(highlightJavaScriptContent(null)).toEqual([{ lineNumber: 1, html: "" }]);
  });
});

describe("frontend/syntax-highlighters/css", () => {
  it("highlights at-rules, colors, numbers, units, and properties", async () => {
    const { highlightCssContent } = await loadCssHighlighter();
    const lines = highlightCssContent(
      [
        "@media (min-width: 600px) {",
        "  .box { color: #ff0000; margin: 10px 1.5em; width: 100%; }",
        "}",
      ].join("\n"),
    );

    expect(lines[0].html).toContain('<span class="hl-keyword">@media</span>');
    expect(lines[0].html).toContain('<span class="hl-number">600px</span>');
    expect(lines[1].html).toContain('<span class="hl-attr">color</span>');
    expect(lines[1].html).toContain('<span class="hl-attr">margin</span>');
    expect(lines[1].html).toContain('<span class="hl-number">#ff0000</span>');
    expect(lines[1].html).toContain('<span class="hl-number">10px</span>');
    expect(lines[1].html).toContain('<span class="hl-number">1.5em</span>');
    expect(lines[1].html).toContain('<span class="hl-number">100%</span>');
  });

  it("tracks comments and strings across lines", async () => {
    const { highlightCssContent } = await loadCssHighlighter();
    const lines = highlightCssContent(
      [
        "before /* inline */ after",
        "start /* spans",
        "still comment",
        'end */ body { background: url("img.png"); }',
        "content: 'quoted \\' esc';",
        'broken: "unterminated',
        "/* never closed",
      ].join("\n"),
    );

    expect(lines[0].html).toContain('<span class="hl-comment">/* inline */</span>');
    expect(lines[1].html).toContain('<span class="hl-comment">/* spans</span>');
    expect(lines[2].html).toBe('<span class="hl-comment">still comment</span>');
    expect(lines[3].html).toContain('<span class="hl-comment">end */</span>');
    expect(lines[3].html).toContain('<span class="hl-string">"img.png"</span>');
    expect(lines[4].html).toContain("hl-string");
    expect(lines[5].html).toContain('<span class="hl-string">"unterminated</span>');
    expect(lines[6].html).toBe('<span class="hl-comment">/* never closed</span>');
  });

  it("uses a default state and tolerates empty content", async () => {
    const { highlightCssLine, highlightCssContent } = await loadCssHighlighter();

    const rendered = highlightCssLine("a { b: 1; }");
    expect(rendered.html).toContain('<span class="hl-attr">b</span>');
    expect(rendered.state).toEqual({ inBlockComment: false });

    expect(highlightCssContent("")).toEqual([{ lineNumber: 1, html: "" }]);
  });
});

describe("frontend/syntax-highlighters/html", () => {
  it("highlights doctype, comments, tags, attributes, and entities", async () => {
    const { highlightHtmlContent } = await loadHtmlHighlighter();
    const lines = highlightHtmlContent(
      [
        "<!DOCTYPE html>",
        "<!-- a comment -->",
        "<div class=\"box\" id='main' data-x=5 hidden>&amp; text &#169;</div>",
        "<br/>",
        "text <b>bold</b> tail",
        '<div ~ a = "v" ~>',
      ].join("\n"),
    );

    expect(lines[0].html).toBe('<span class="hl-meta">&lt;!DOCTYPE html&gt;</span>');
    expect(lines[1].html).toBe('<span class="hl-meta">&lt;!-- a comment --&gt;</span>');
    expect(lines[2].html).toContain('<span class="hl-tag">div</span>');
    expect(lines[2].html).toContain('<span class="hl-attr">class</span>');
    expect(lines[2].html).toContain('<span class="hl-string">"box"</span>');
    expect(lines[2].html).toContain("<span class=\"hl-string\">'main'</span>");
    expect(lines[2].html).toContain('<span class="hl-string">5</span>');
    expect(lines[2].html).toContain('<span class="hl-attr">hidden</span>');
    expect(lines[2].html).toContain('<span class="hl-entity">&amp;</span>amp;');
    expect(lines[3].html).toContain('<span class="hl-punc">/&gt;</span>');
    expect(lines[4].html).toContain("text ");
    expect(lines[4].html).toContain(" tail");
    expect(lines[4].html).toContain('<span class="hl-punc">&lt;/</span>');
    expect(lines[5].html).toContain('<span class="hl-attr">a</span>');
    expect(lines[5].html).toContain('<span class="hl-punc">=</span>');
    expect(lines[5].html).toContain('<span class="hl-string">"v"</span>');
    expect(lines[5].html).toContain("~");
  });

  it("switches into script and style modes across lines", async () => {
    const { highlightHtmlContent } = await loadHtmlHighlighter();
    const lines = highlightHtmlContent(
      [
        "<style>",
        ".box { color: red; }",
        "/* <style> mention */",
        "</style>",
        "<script>",
        "const n = 1; // js",
        'load("<script src=x>");',
        "</script>",
      ].join("\n"),
    );

    expect(lines[0].html).toContain('<span class="hl-tag">style</span>');
    expect(lines[1].html).toContain('<span class="hl-attr">color</span>');
    expect(lines[2].html).toContain('<span class="hl-comment">');
    expect(lines[3].html).toContain('<span class="hl-tag">style</span>');
    expect(lines[4].html).toContain('<span class="hl-tag">script</span>');
    expect(lines[5].html).toContain('<span class="hl-keyword">const</span>');
    expect(lines[5].html).toContain('<span class="hl-comment">// js</span>');
    expect(lines[6].html).toContain('class="hl-string"');
    expect(lines[7].html).toContain('<span class="hl-tag">script</span>');
  });

  it("handles inline script/style blocks that open and close on one line", async () => {
    const { highlightHtmlContent } = await loadHtmlHighlighter();
    const lines = highlightHtmlContent(
      [
        "<style>.b{margin:0}</style>after",
        "<script>var inline = 'y';</script>",
        "<style>x{}</style><script>y()</script>",
        "<script>never closes",
        "still js here",
      ].join("\n"),
    );

    expect(lines[0].html).toContain('<span class="hl-attr">margin</span>');
    expect(lines[0].html).toContain("after");
    expect(lines[1].html).toContain("<span class=\"hl-string\">'y'</span>");
    expect(lines[2].html).toContain('<span class="hl-tag">style</span>');
    expect(lines[2].html).toContain('<span class="hl-tag">script</span>');
    expect(lines[3].html).toContain('<span class="hl-tag">script</span>');
    expect(lines[3].html).toContain("never closes");
    expect(lines[4].html).toContain("still js here");
  });

  it("tolerates empty content", async () => {
    const { highlightHtmlContent } = await loadHtmlHighlighter();

    expect(highlightHtmlContent("")).toEqual([{ lineNumber: 1, html: "" }]);
  });
});

describe("frontend/syntax-highlighters/frontmatter", () => {
  it("parses frontmatter entries and strips the fenced block from the body", async () => {
    const { parseFrontmatter } = await loadFrontmatter();

    const parsed = parseFrontmatter(
      [
        "---",
        "title: Hello",
        "plain line without colon",
        ": leading colon",
        "  : blank key",
        "empty:",
        "---",
        "",
        "Body text",
      ].join("\n"),
    );

    expect(parsed.entries).toEqual([
      { key: "title", rawValue: "Hello" },
      { key: "empty", rawValue: "" },
    ]);
    expect(parsed.body).toBe("Body text");
  });

  it("returns the raw value untouched when no frontmatter exists", async () => {
    const { parseFrontmatter } = await loadFrontmatter();

    expect(parseFrontmatter("no frontmatter here")).toEqual({
      entries: [],
      body: "no frontmatter here",
    });
    expect(parseFrontmatter("---")).toEqual({ entries: [], body: "---" });
    expect(parseFrontmatter("---\nkey: value")).toEqual({
      entries: [],
      body: "---\nkey: value",
    });
    expect(parseFrontmatter(null)).toEqual({ entries: [], body: "" });
  });

  it("pretty-prints JSON-like values and passes through others", async () => {
    const { formatFrontmatterValue } = await loadFrontmatter();

    expect(formatFrontmatterValue("")).toBe("");
    expect(formatFrontmatterValue(null)).toBe("");
    expect(formatFrontmatterValue('{"a":1}')).toBe(
      JSON.stringify({ a: 1 }, null, 2),
    );
    expect(formatFrontmatterValue("[1,2]")).toBe(JSON.stringify([1, 2], null, 2));
    expect(formatFrontmatterValue("{not json}")).toBe("{not json}");
    expect(formatFrontmatterValue("  plain  ")).toBe("plain");
  });
});
