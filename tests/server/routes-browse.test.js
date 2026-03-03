const fs = require("fs");
const os = require("os");
const path = require("path");
const express = require("express");
const request = require("supertest");

const { registerBrowseRoutes } = require("../../lib/server/routes/browse");

const createTestRoot = () => fs.mkdtempSync(path.join(os.tmpdir(), "alphaclaw-browse-test-"));

const createApp = (kRootDir) => {
  const app = express();
  app.use(express.json());
  registerBrowseRoutes({ app, fs, kRootDir });
  return app;
};

describe("server/routes/browse", () => {
  it("returns browse tree rooted at configured directory", async () => {
    const rootDir = createTestRoot();
    fs.mkdirSync(path.join(rootDir, "devices"), { recursive: true });
    fs.mkdirSync(path.join(rootDir, ".alphaclaw"), { recursive: true });
    fs.writeFileSync(path.join(rootDir, "openclaw.json"), '{"ok":true}\n', "utf8");
    fs.writeFileSync(path.join(rootDir, "devices", "paired.json"), "[]\n", "utf8");
    fs.writeFileSync(path.join(rootDir, ".alphaclaw", "hourly-git-sync.sh"), "#!/bin/bash\n", "utf8");
    const app = createApp(rootDir);

    const res = await request(app).get("/api/browse/tree");

    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(res.body.root).toEqual(
      expect.objectContaining({
        type: "folder",
        path: "",
        name: path.basename(rootDir),
      }),
    );
    expect(res.body.root.children).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ type: "folder", path: "devices", name: "devices" }),
        expect.objectContaining({ type: "file", path: "openclaw.json", name: "openclaw.json" }),
      ]),
    );
    expect(
      (res.body.root.children || []).some((entry) => entry?.name === ".alphaclaw"),
    ).toBe(false);
  });

  it("rejects path traversal on read", async () => {
    const rootDir = createTestRoot();
    const app = createApp(rootDir);

    const res = await request(app)
      .get("/api/browse/read")
      .query({ path: "../outside.txt" });

    expect(res.status).toBe(400);
    expect(res.body.ok).toBe(false);
    expect(res.body.error).toContain("Path must stay within");
  });

  it("rejects path traversal on git diff", async () => {
    const rootDir = createTestRoot();
    const app = createApp(rootDir);

    const res = await request(app)
      .get("/api/browse/git-diff")
      .query({ path: "../outside.txt" });

    expect(res.status).toBe(400);
    expect(res.body.ok).toBe(false);
    expect(res.body.error).toContain("Path must stay within");
  });

  it("rejects likely binary files on read", async () => {
    const rootDir = createTestRoot();
    const binaryFilePath = path.join(rootDir, "image.bin");
    fs.writeFileSync(binaryFilePath, Buffer.from([0x41, 0x00, 0x42]));
    const app = createApp(rootDir);

    const res = await request(app)
      .get("/api/browse/read")
      .query({ path: "image.bin" });

    expect(res.status).toBe(400);
    expect(res.body).toEqual({
      ok: false,
      error: "Binary files are not editable",
    });
  });

  it("returns audio previews for supported audio files", async () => {
    const rootDir = createTestRoot();
    const audioFilePath = path.join(rootDir, "clip.mp3");
    fs.writeFileSync(audioFilePath, Buffer.from([0xff, 0xfb, 0x90, 0x64]));
    const app = createApp(rootDir);

    const res = await request(app)
      .get("/api/browse/read")
      .query({ path: "clip.mp3" });

    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(res.body.kind).toBe("audio");
    expect(res.body.mimeType).toBe("audio/mpeg");
    expect(String(res.body.audioDataUrl || "")).toContain("data:audio/mpeg;base64,");
    expect(res.body.content).toBe("");
  });

  it("writes file content and returns write result", async () => {
    const rootDir = createTestRoot();
    const filePath = path.join(rootDir, "openclaw.json");
    fs.writeFileSync(filePath, '{"before":true}\n', "utf8");
    const app = createApp(rootDir);

    const res = await request(app).put("/api/browse/write").send({
      path: "openclaw.json",
      content: '{"after":true}\n',
    });

    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(res.body.path).toBe("openclaw.json");
    expect(fs.readFileSync(filePath, "utf8")).toBe('{"after":true}\n');
  });

  it("rejects writes to locked bootstrap files", async () => {
    const rootDir = createTestRoot();
    const lockedPath = path.join(rootDir, "hooks", "bootstrap", "AGENTS.md");
    fs.mkdirSync(path.dirname(lockedPath), { recursive: true });
    fs.writeFileSync(lockedPath, "before\n", "utf8");
    const app = createApp(rootDir);

    const res = await request(app).put("/api/browse/write").send({
      path: "hooks/bootstrap/AGENTS.md",
      content: "after\n",
    });

    expect(res.status).toBe(403);
    expect(res.body).toEqual({
      ok: false,
      error: "This file is managed by Alpha Claw and cannot be edited.",
    });
    expect(fs.readFileSync(lockedPath, "utf8")).toBe("before\n");
  });

  it("rejects writes to locked bootstrap files with workspace prefix", async () => {
    const rootDir = createTestRoot();
    const lockedPath = path.join(rootDir, "workspace", "hooks", "bootstrap", "AGENTS.md");
    fs.mkdirSync(path.dirname(lockedPath), { recursive: true });
    fs.writeFileSync(lockedPath, "before\n", "utf8");
    const app = createApp(rootDir);

    const res = await request(app).put("/api/browse/write").send({
      path: "workspace/hooks/bootstrap/AGENTS.md",
      content: "after\n",
    });

    expect(res.status).toBe(403);
    expect(res.body).toEqual({
      ok: false,
      error: "This file is managed by Alpha Claw and cannot be edited.",
    });
    expect(fs.readFileSync(lockedPath, "utf8")).toBe("before\n");
  });

  it("rejects writes to locked managed files under .alphaclaw", async () => {
    const rootDir = createTestRoot();
    const lockedPath = path.join(rootDir, ".alphaclaw", "hourly-git-sync.sh");
    fs.mkdirSync(path.dirname(lockedPath), { recursive: true });
    fs.writeFileSync(lockedPath, "before\n", "utf8");
    const app = createApp(rootDir);

    const res = await request(app).put("/api/browse/write").send({
      path: ".alphaclaw/hourly-git-sync.sh",
      content: "after\n",
    });

    expect(res.status).toBe(403);
    expect(res.body).toEqual({
      ok: false,
      error: "This file is managed by Alpha Claw and cannot be edited.",
    });
    expect(fs.readFileSync(lockedPath, "utf8")).toBe("before\n");
  });

  it("returns non-repo git summary outside git repositories", async () => {
    const rootDir = createTestRoot();
    const app = createApp(rootDir);

    const res = await request(app).get("/api/browse/git-summary");

    expect(res.status).toBe(200);
    expect(res.body).toEqual(
      expect.objectContaining({
        ok: true,
        isRepo: false,
        repoPath: path.resolve(rootDir),
      }),
    );
  });

  it("rejects git sync outside git repositories", async () => {
    const rootDir = createTestRoot();
    const app = createApp(rootDir);

    const res = await request(app).post("/api/browse/git-sync").send({
      message: "sync changes",
    });

    expect(res.status).toBe(400);
    expect(res.body).toEqual({
      ok: false,
      error: "No git repo at this root",
    });
  });
});
