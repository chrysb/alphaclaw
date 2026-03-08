const loadClipboardModule = async () => import("../../lib/public/js/lib/clipboard.js");

describe("frontend/clipboard", () => {
  beforeEach(() => {
    vi.unstubAllGlobals();
    vi.stubGlobal("navigator", {});
    vi.stubGlobal("document", undefined);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("uses the async clipboard API when available", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal("navigator", {
      clipboard: { writeText },
    });

    const { copyTextToClipboard } = await loadClipboardModule();

    await expect(copyTextToClipboard("workspace/docs/readme.md")).resolves.toBe(true);
    expect(writeText).toHaveBeenCalledWith("workspace/docs/readme.md");
  });

  it("falls back to document.execCommand when clipboard API is unavailable", async () => {
    const appendChild = vi.fn();
    const removeChild = vi.fn();
    const select = vi.fn();
    const setAttribute = vi.fn();
    const fallbackElement = {
      value: "",
      style: {},
      select,
      setAttribute,
    };

    vi.stubGlobal("document", {
      createElement: vi.fn(() => fallbackElement),
      execCommand: vi.fn(() => true),
      body: {
        appendChild,
        removeChild,
      },
    });

    const { copyTextToClipboard } = await loadClipboardModule();

    await expect(copyTextToClipboard("workspace/config.json")).resolves.toBe(true);
    expect(global.document.createElement).toHaveBeenCalledWith("textarea");
    expect(setAttribute).toHaveBeenCalledWith("readonly", "");
    expect(select).toHaveBeenCalledTimes(1);
    expect(global.document.execCommand).toHaveBeenCalledWith("copy");
    expect(appendChild).toHaveBeenCalledWith(fallbackElement);
    expect(removeChild).toHaveBeenCalledWith(fallbackElement);
  });

  it("returns false when there is no text to copy", async () => {
    const { copyTextToClipboard } = await loadClipboardModule();

    await expect(copyTextToClipboard("")).resolves.toBe(false);
  });
});
