const loadFileViewerUtils = async () =>
  import("../../lib/public/js/components/file-viewer/utils.js");

describe("frontend/file-viewer-utils", () => {
  it("counts lines without splitting huge strings", async () => {
    const { countTextLines } = await loadFileViewerUtils();

    expect(countTextLines("")).toBe(1);
    expect(countTextLines("one line")).toBe(1);
    expect(countTextLines("a\nb\nc")).toBe(3);
  });

  it("switches to simple editor mode for very large files", async () => {
    const { shouldUseSimpleEditorMode } = await loadFileViewerUtils();

    expect(
      shouldUseSimpleEditorMode({
        contentLength: 300000,
        lineCount: 50,
        charThreshold: 250000,
        lineThreshold: 5000,
      }),
    ).toBe(true);
    expect(
      shouldUseSimpleEditorMode({
        contentLength: 1000,
        lineCount: 8000,
        charThreshold: 250000,
        lineThreshold: 5000,
      }),
    ).toBe(true);
    expect(
      shouldUseSimpleEditorMode({
        contentLength: 1000,
        lineCount: 100,
        charThreshold: 250000,
        lineThreshold: 5000,
      }),
    ).toBe(false);
  });
});
