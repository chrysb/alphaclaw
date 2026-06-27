const fs = require("fs");
const os = require("os");
const path = require("path");
const { execSync } = require("child_process");
const express = require("express");
const request = require("supertest");

const { registerBrowseRoutes } = require("../../lib/server/routes/browse");

const createTestRoot = () =>
  fs.mkdtempSync(path.join(os.tmpdir(), "alphaclaw-browse-test-"));

const createApp = (kRootDir) => {
  const app = express();
  app.use(express.json());
  registerBrowseRoutes({ app, fs, kRootDir });
  return app;
};

const runGit = (cwd, args) =>
  execSync(`git ${args}`, {
    cwd,
    stdio: ["ignore", "pipe", "pipe"],
  })
    .toString()
    .trim();

describe("server/routes/browse", () => {
  it("returns browse tree rooted at configured directory", async () => {
    const rootDir = createTestRoot();
    fs.mkdirSync(path.join(rootDir, "devices"), { recursive: true });
    fs.mkdirSync(path.join(rootDir, ".alphaclaw"), { recursive: true });
    fs.writeFileSync(
      path.join(rootDir, "openclaw.json"),
      '{"ok":true}\n',
      "utf8",
    );
    fs.writeFileSync(
      path.join(rootDir, "devices", "paired.json"),
      "[]\n",
      "utf8",
    );
    fs.writeFileSync(
      path.join(rootDir, ".alphaclaw", "hourly-git-sync.sh"),
      "#!/bin/bash\n",
      "utf8",
    );
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
        expect.objectContaining({
          type: "folder",
          path: "devices",
          name: "devices",
        }),
        expect.objectContaining({
          type: "file",
          path: "openclaw.json",
          name: "openclaw.json",
        }),
      ]),
    );
    expect(
      (res.body.root.children || []).some(
        (entry) => entry?.name === ".alphaclaw",
      ),
    ).toBe(false);
  });

  it("caps requested browse tree depth", async () => {
    const rootDir = createTestRoot();
    fs.mkdirSync(path.join(rootDir, "level-1", "level-2", "level-3", "level-4"), {
      recursive: true,
    });
    fs.writeFileSync(
      path.join(rootDir, "level-1", "level-2", "level-3", "level-4", "too-deep.txt"),
      "hidden\n",
      "utf8",
    );
    const app = createApp(rootDir);

    const res = await request(app).get("/api/browse/tree").query({ depth: 10 });

    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
    const level1 = res.body.root.children.find((entry) => entry.name === "level-1");
    const level2 = level1.children.find((entry) => entry.name === "level-2");
    const level3 = level2.children.find((entry) => entry.name === "level-3");
    expect(level3.truncated).toBe(true);
    expect(level3.children).toEqual([]);
  });

  it("loads capped folder subtrees by path", async () => {
    const rootDir = createTestRoot();
    fs.mkdirSync(path.join(rootDir, "level-1", "level-2", "level-3", "level-4"), {
      recursive: true,
    });
    fs.writeFileSync(
      path.join(rootDir, "level-1", "level-2", "level-3", "level-4", "deep.txt"),
      "visible after expansion\n",
      "utf8",
    );
    const app = createApp(rootDir);

    const res = await request(app)
      .get("/api/browse/tree")
      .query({ depth: 10, path: "level-1/level-2/level-3" });

    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(res.body.root.path).toBe("level-1/level-2/level-3");
    const level4 = res.body.root.children.find((entry) => entry.name === "level-4");
    expect(level4.children).toEqual([
      expect.objectContaining({
        type: "file",
        name: "deep.txt",
        path: "level-1/level-2/level-3/level-4/deep.txt",
      }),
    ]);
  });

  it("honors explicit shallow browse tree depth below the cap", async () => {
    const rootDir = createTestRoot();
    fs.mkdirSync(path.join(rootDir, "level-1", "level-2"), { recursive: true });
    fs.writeFileSync(
      path.join(rootDir, "level-1", "level-2", "nested.txt"),
      "hidden\n",
      "utf8",
    );
    const app = createApp(rootDir);

    const res = await request(app).get("/api/browse/tree").query({ depth: 1 });

    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
    const level1 = res.body.root.children.find((entry) => entry.name === "level-1");
    expect(level1.children).toEqual([]);
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
    expect(String(res.body.audioDataUrl || "")).toContain(
      "data:audio/mpeg;base64,",
    );
    expect(res.body.content).toBe("");
  });

  it("returns sqlite schema previews for sqlite files", async () => {
    let DatabaseSync = null;
    try {
      ({ DatabaseSync } = require("node:sqlite"));
    } catch {
      // Runtime does not support node:sqlite.
      return;
    }
    const rootDir = createTestRoot();
    const dbPath = path.join(rootDir, "test.sqlite");
    const database = new DatabaseSync(dbPath);
    database.exec(
      `
        CREATE TABLE users (
          id INTEGER PRIMARY KEY,
          name TEXT NOT NULL
        );
        INSERT INTO users (name) VALUES ('Ada');
      `,
    );
    database.close();
    const app = createApp(rootDir);

    const res = await request(app)
      .get("/api/browse/read")
      .query({ path: "test.sqlite" });

    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(res.body.kind).toBe("sqlite");
    expect(res.body.sqliteSummary).toBeTruthy();
    expect(Array.isArray(res.body.sqliteSummary.objects)).toBe(true);
    expect(
      res.body.sqliteSummary.objects.some((entry) => entry?.name === "users"),
    ).toBe(true);
    expect(res.body.content).toBe("");
  });

  it("returns sqlite table rows for selected table", async () => {
    let DatabaseSync = null;
    try {
      ({ DatabaseSync } = require("node:sqlite"));
    } catch {
      return;
    }
    const rootDir = createTestRoot();
    const dbPath = path.join(rootDir, "rows.sqlite");
    const database = new DatabaseSync(dbPath);
    database.exec(
      `
        CREATE TABLE users (
          id INTEGER PRIMARY KEY,
          name TEXT NOT NULL
        );
        INSERT INTO users (name) VALUES ('Ada'), ('Grace');
      `,
    );
    database.close();
    const app = createApp(rootDir);

    const res = await request(app)
      .get("/api/browse/sqlite-table")
      .query({ path: "rows.sqlite", table: "users", limit: "1", offset: "1" });

    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(res.body.table).toBe("users");
    expect(Array.isArray(res.body.columns)).toBe(true);
    expect(Array.isArray(res.body.rows)).toBe(true);
    expect(res.body.rows.length).toBe(1);
    expect(res.body.totalRows).toBe(2);
    expect(res.body.limit).toBe(1);
    expect(res.body.offset).toBe(1);
  });

  it("downloads files as attachments", async () => {
    const rootDir = createTestRoot();
    const filePath = path.join(rootDir, "download-me.txt");
    fs.writeFileSync(filePath, "file payload\n", "utf8");
    const app = createApp(rootDir);

    const res = await request(app)
      .get("/api/browse/download")
      .query({ path: "download-me.txt" });

    expect(res.status).toBe(200);
    expect(String(res.headers["content-disposition"] || "")).toContain(
      'attachment; filename="download-me.txt"',
    );
    expect(res.text).toBe("file payload\n");
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
      error: "This file is managed by AlphaClaw and cannot be edited.",
    });
    expect(fs.readFileSync(lockedPath, "utf8")).toBe("before\n");
  });

  it("rejects writes to locked bootstrap files with workspace prefix", async () => {
    const rootDir = createTestRoot();
    const lockedPath = path.join(
      rootDir,
      "workspace",
      "hooks",
      "bootstrap",
      "AGENTS.md",
    );
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
      error: "This file is managed by AlphaClaw and cannot be edited.",
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
      error: "This file is managed by AlphaClaw and cannot be edited.",
    });
    expect(fs.readFileSync(lockedPath, "utf8")).toBe("before\n");
  });

  it("deletes regular files", async () => {
    const rootDir = createTestRoot();
    const filePath = path.join(rootDir, "deleteme.txt");
    fs.writeFileSync(filePath, "delete me\n", "utf8");
    const app = createApp(rootDir);

    const res = await request(app).delete("/api/browse/delete").send({
      path: "deleteme.txt",
    });

    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      ok: true,
      path: "deleteme.txt",
      type: "file",
    });
    expect(fs.existsSync(filePath)).toBe(false);
  });

  it("rejects deleting protected files", async () => {
    const rootDir = createTestRoot();
    const filePath = path.join(rootDir, "openclaw.json");
    fs.writeFileSync(filePath, '{"ok":true}\n', "utf8");
    const app = createApp(rootDir);

    const res = await request(app).delete("/api/browse/delete").send({
      path: "openclaw.json",
    });

    expect(res.status).toBe(403);
    expect(res.body).toEqual({
      ok: false,
      error: "This path cannot be deleted from the explorer.",
    });
    expect(fs.existsSync(filePath)).toBe(true);
  });

  it("deletes directories recursively", async () => {
    const rootDir = createTestRoot();
    const dirPath = path.join(rootDir, "delivery-queue");
    fs.mkdirSync(dirPath, { recursive: true });
    fs.writeFileSync(path.join(dirPath, "child.txt"), "hi", "utf8");
    const app = createApp(rootDir);

    const res = await request(app).delete("/api/browse/delete").send({
      path: "delivery-queue",
    });

    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      ok: true,
      path: "delivery-queue",
      type: "folder",
    });
    expect(fs.existsSync(dirPath)).toBe(false);
  });

  it("restores a tracked deleted file from git", async () => {
    const rootDir = createTestRoot();
    const app = createApp(rootDir);
    const filePath = path.join(rootDir, "restore-me.json");
    fs.writeFileSync(filePath, '{"restore":true}\n', "utf8");

    runGit(rootDir, "init");
    runGit(rootDir, "config user.email test@example.com");
    runGit(rootDir, "config user.name Test User");
    runGit(rootDir, "add restore-me.json");
    runGit(rootDir, "commit -m \"test commit\"");

    fs.rmSync(filePath, { force: true });
    expect(fs.existsSync(filePath)).toBe(false);

    const res = await request(app).post("/api/browse/restore").send({
      path: "restore-me.json",
    });

    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      ok: true,
      path: "restore-me.json",
      restored: true,
    });
    expect(fs.existsSync(filePath)).toBe(true);
    expect(fs.readFileSync(filePath, "utf8")).toBe('{"restore":true}\n');
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
