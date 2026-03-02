const loadFileTreeUtils = async () => import("../../lib/public/js/lib/file-tree-utils.js");

describe("frontend/file-tree-utils", () => {
  it("collects ancestor folder paths for selected files", async () => {
    const { collectAncestorFolderPaths } = await loadFileTreeUtils();

    expect(collectAncestorFolderPaths("devices/agents/config.json")).toEqual([
      "devices",
      "devices/agents",
    ]);
  });

  it("returns empty list for top-level files", async () => {
    const { collectAncestorFolderPaths } = await loadFileTreeUtils();

    expect(collectAncestorFolderPaths("openclaw.json")).toEqual([]);
    expect(collectAncestorFolderPaths("")).toEqual([]);
  });
});
