const loadDraftState = async () => import("../../lib/public/js/lib/browse-draft-state.js");

const createStorage = () => {
  const store = new Map();
  return {
    get length() {
      return store.size;
    },
    key: (index) => Array.from(store.keys())[index] || null,
    getItem: (key) => (store.has(key) ? store.get(key) : null),
    setItem: (key, value) => {
      store.set(String(key), String(value));
    },
    removeItem: (key) => {
      store.delete(String(key));
    },
  };
};

describe("frontend/browse-draft-state", () => {
  it("writes, reads, and clears per-file drafts", async () => {
    const storage = createStorage();
    const draftState = await loadDraftState();

    draftState.writeStoredFileDraft("workspace/a.md", "draft body", storage);
    expect(draftState.readStoredFileDraft("workspace/a.md", storage)).toBe("draft body");

    draftState.clearStoredFileDraft("workspace/a.md", storage);
    expect(draftState.readStoredFileDraft("workspace/a.md", storage)).toBe("");
  });

  it("updates draft index and dispatches changes", async () => {
    const storage = createStorage();
    const dispatchEvent = vi.fn();
    const draftState = await loadDraftState();

    draftState.updateDraftIndex("workspace/a.md", true, { storage, dispatchEvent });
    draftState.updateDraftIndex("workspace/b.md", true, { storage, dispatchEvent });
    draftState.updateDraftIndex("workspace/a.md", false, { storage, dispatchEvent });

    const index = draftState.readDraftIndex(storage);
    expect(Array.from(index)).toEqual(["workspace/b.md"]);
    expect(dispatchEvent).toHaveBeenCalledTimes(3);
  });

  it("builds draft index from legacy per-file keys", async () => {
    const storage = createStorage();
    const draftState = await loadDraftState();
    storage.setItem("alphaclawBrowseDraft:legacy/a.txt", "a");
    storage.setItem("alphaclaw.browse.draft.current/b.txt", "b");

    const draftPaths = draftState.readStoredDraftPaths(storage);

    expect(Array.from(draftPaths).sort()).toEqual(["current/b.txt", "legacy/a.txt"]);
    const storedIndexRaw = storage.getItem("alphaclaw.draftIndex");
    expect(storedIndexRaw).toBeTruthy();
    expect(JSON.parse(storedIndexRaw)).toEqual(["current/b.txt", "legacy/a.txt"]);
  });
});
