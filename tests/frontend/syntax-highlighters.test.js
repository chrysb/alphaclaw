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
