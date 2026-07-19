const {
  calculateWorkspaceDelta,
  computeWorkspaceFingerprintFromManifest,
  isContentFile,
} = require("../../lib/server/doctor/workspace-fingerprint");

describe("server/doctor/workspace-fingerprint", () => {
  it("classifies content files by extension", () => {
    expect(isContentFile("docs/notes.md")).toBe(true);
    expect(isContentFile("data.bin")).toBe(false);
    expect(isContentFile("")).toBe(false);
  });

  it("computes a stable fingerprint regardless of manifest key order", () => {
    const first = computeWorkspaceFingerprintFromManifest({
      "a.md": { hash: "h1", size: 10 },
      "b.md": { hash: "h2", size: 20 },
    });
    const second = computeWorkspaceFingerprintFromManifest({
      "b.md": { hash: "h2", size: 20 },
      "a.md": { hash: "h1", size: 10 },
    });
    expect(first).toBe(second);
  });

  it("scores added, removed, and modified files with path and byte-delta weights", () => {
    const previousManifest = {
      "docs/notes.md": { hash: "a", size: 1000 },
      "docs/big.md": { hash: "c", size: 100 },
      "gone.md": { hash: "g", size: 5 },
      "same.md": { hash: "s", size: 3 },
    };
    const currentManifest = {
      "docs/notes.md": { hash: "b", size: 1200 },
      "docs/big.md": { hash: "d", size: 700 },
      "data.bin": { hash: "x", size: 10 },
      "same.md": { hash: "s", size: 3 },
    };

    const delta = calculateWorkspaceDelta({ previousManifest, currentManifest });

    expect(delta.addedFilesCount).toBe(1);
    expect(delta.removedFilesCount).toBe(1);
    expect(delta.modifiedFilesCount).toBe(2);
    expect(delta.changedFilesCount).toBe(4);
    // notes.md: byte delta 200 => 2; big.md: byte delta 600 => weight 2 (plain .md);
    // gone.md removed => weight 2; data.bin added => weight 1
    expect(delta.deltaScore).toBe(7);
    expect(delta.changedPaths).toEqual([
      "data.bin",
      "docs/big.md",
      "docs/notes.md",
      "gone.md",
    ]);
  });

  it("scores small modifications and non-content files with minimal weight", () => {
    const delta = calculateWorkspaceDelta({
      previousManifest: {
        "docs/notes.md": { hash: "a", size: 1000 },
        "blob.bin": { hash: "p", size: 100 },
      },
      currentManifest: {
        "docs/notes.md": { hash: "b", size: 1050 },
        "blob.bin": { hash: "q", size: 100000 },
      },
    });

    // notes.md byte delta 50 (<100) => 1; blob.bin not a content file => 1
    expect(delta.modifiedFilesCount).toBe(2);
    expect(delta.deltaScore).toBe(2);
  });

  it("uses the path weight when modified content sizes are unavailable", () => {
    const delta = calculateWorkspaceDelta({
      previousManifest: { "AGENTS.md": "hash-a" },
      currentManifest: { "AGENTS.md": "hash-b" },
    });

    expect(delta.modifiedFilesCount).toBe(1);
    expect(delta.deltaScore).toBe(4);
  });

  it("weights special guidance paths higher for additions", () => {
    const delta = calculateWorkspaceDelta({
      previousManifest: {},
      currentManifest: {
        "hooks/bootstrap/AGENTS.md": { hash: "a", size: 1 },
        "skills/foo.md": { hash: "b", size: 1 },
      },
    });

    expect(delta.addedFilesCount).toBe(2);
    expect(delta.deltaScore).toBe(7);
  });
});
