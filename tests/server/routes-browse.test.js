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

const initRepo = (rootDir) => {
  runGit(rootDir, "init -q -b main");
  runGit(rootDir, "config user.email test@example.com");
  runGit(rootDir, "config user.name Test User");
  runGit(rootDir, "config commit.gpgsign false");
};

describe("server/routes/browse tree edge cases", () => {
  it("creates the root directory when it does not exist", async () => {
    const parentDir = createTestRoot();
    const rootDir = path.join(parentDir, "missing-root");
    expect(fs.existsSync(rootDir)).toBe(false);
    const app = createApp(rootDir);

    const res = await request(app).get("/api/browse/tree");

    expect(res.status).toBe(200);
    expect(fs.existsSync(rootDir)).toBe(true);
  });

  it("sorts sibling entries of the same type by name", async () => {
    const rootDir = createTestRoot();
    fs.mkdirSync(path.join(rootDir, "zeta-folder"));
    fs.mkdirSync(path.join(rootDir, "alpha-folder"));
    fs.writeFileSync(path.join(rootDir, "zeta.txt"), "z\n", "utf8");
    fs.writeFileSync(path.join(rootDir, "alpha.txt"), "a\n", "utf8");
    const app = createApp(rootDir);

    const res = await request(app).get("/api/browse/tree");

    expect(res.status).toBe(200);
    expect(res.body.root.children.map((entry) => entry.name)).toEqual([
      "alpha-folder",
      "zeta-folder",
      "alpha.txt",
      "zeta.txt",
    ]);
  });

  it("rejects path traversal on tree", async () => {
    const rootDir = createTestRoot();
    const app = createApp(rootDir);

    const res = await request(app)
      .get("/api/browse/tree")
      .query({ path: "../outside" });

    expect(res.status).toBe(400);
    expect(res.body.ok).toBe(false);
    expect(res.body.error).toContain("Path must stay within");
  });

  it("rejects tree requests targeting a file", async () => {
    const rootDir = createTestRoot();
    fs.writeFileSync(path.join(rootDir, "plain.txt"), "hi\n", "utf8");
    const app = createApp(rootDir);

    const res = await request(app)
      .get("/api/browse/tree")
      .query({ path: "plain.txt" });

    expect(res.status).toBe(400);
    expect(res.body).toEqual({ ok: false, error: "Path is not a folder" });
  });

  it("returns 500 when the tree path does not exist", async () => {
    const rootDir = createTestRoot();
    const app = createApp(rootDir);

    const res = await request(app)
      .get("/api/browse/tree")
      .query({ path: "does-not-exist" });

    expect(res.status).toBe(500);
    expect(res.body.ok).toBe(false);
    expect(res.body.error).toBeTruthy();
  });
});

describe("server/routes/browse read edge cases", () => {
  it("rejects reads of directories", async () => {
    const rootDir = createTestRoot();
    fs.mkdirSync(path.join(rootDir, "folder"));
    const app = createApp(rootDir);

    const res = await request(app)
      .get("/api/browse/read")
      .query({ path: "folder" });

    expect(res.status).toBe(400);
    expect(res.body).toEqual({ ok: false, error: "Path is not a file" });
  });

  it("returns image previews for binary image files", async () => {
    const rootDir = createTestRoot();
    fs.writeFileSync(
      path.join(rootDir, "pic.png"),
      Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x00, 0x00, 0x00, 0x0d]),
    );
    const app = createApp(rootDir);

    const res = await request(app)
      .get("/api/browse/read")
      .query({ path: "pic.png" });

    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(res.body.kind).toBe("image");
    expect(res.body.mimeType).toBe("image/png");
    expect(String(res.body.imageDataUrl || "")).toContain(
      "data:image/png;base64,",
    );
    expect(res.body.content).toBe("");
  });

  it("returns text content for plain text files", async () => {
    const rootDir = createTestRoot();
    fs.writeFileSync(path.join(rootDir, "notes.txt"), "hello world\n", "utf8");
    const app = createApp(rootDir);

    const res = await request(app)
      .get("/api/browse/read")
      .query({ path: "notes.txt" });

    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      ok: true,
      path: "notes.txt",
      kind: "text",
      content: "hello world\n",
    });
  });

  it("returns 500 when the read path does not exist", async () => {
    const rootDir = createTestRoot();
    const app = createApp(rootDir);

    const res = await request(app)
      .get("/api/browse/read")
      .query({ path: "missing.txt" });

    expect(res.status).toBe(500);
    expect(res.body.ok).toBe(false);
  });
});

describe("server/routes/browse download edge cases", () => {
  it("rejects path traversal on download", async () => {
    const rootDir = createTestRoot();
    const app = createApp(rootDir);

    const res = await request(app)
      .get("/api/browse/download")
      .query({ path: "../outside.txt" });

    expect(res.status).toBe(400);
    expect(res.body.error).toContain("Path must stay within");
  });

  it("rejects downloads of directories", async () => {
    const rootDir = createTestRoot();
    fs.mkdirSync(path.join(rootDir, "folder"));
    const app = createApp(rootDir);

    const res = await request(app)
      .get("/api/browse/download")
      .query({ path: "folder" });

    expect(res.status).toBe(400);
    expect(res.body).toEqual({ ok: false, error: "Path is not a file" });
  });

  it("returns 500 when the download path does not exist", async () => {
    const rootDir = createTestRoot();
    const app = createApp(rootDir);

    const res = await request(app)
      .get("/api/browse/download")
      .query({ path: "missing.txt" });

    expect(res.status).toBe(500);
    expect(res.body.ok).toBe(false);
  });

  it("returns 500 when the file cannot be streamed", async () => {
    if (typeof process.getuid === "function" && process.getuid() === 0) {
      return;
    }
    const rootDir = createTestRoot();
    const filePath = path.join(rootDir, "secret.txt");
    fs.writeFileSync(filePath, "shh\n", "utf8");
    fs.chmodSync(filePath, 0o000);
    const app = createApp(rootDir);

    try {
      const res = await request(app)
        .get("/api/browse/download")
        .query({ path: "secret.txt" });

      expect(res.status).toBe(500);
      // The failed download keeps the attachment content-type, so parse
      // the JSON payload from the raw text body.
      expect(JSON.parse(res.text)).toEqual({
        ok: false,
        error: expect.stringContaining("EACCES"),
      });
    } finally {
      fs.chmodSync(filePath, 0o644);
    }
  });
});

describe("server/routes/browse sqlite-table edge cases", () => {
  it("rejects path traversal on sqlite-table", async () => {
    const rootDir = createTestRoot();
    const app = createApp(rootDir);

    const res = await request(app)
      .get("/api/browse/sqlite-table")
      .query({ path: "../outside.sqlite", table: "users" });

    expect(res.status).toBe(400);
    expect(res.body.error).toContain("Path must stay within");
  });

  it("rejects non-sqlite files on sqlite-table", async () => {
    const rootDir = createTestRoot();
    fs.writeFileSync(path.join(rootDir, "notes.txt"), "hi\n", "utf8");
    const app = createApp(rootDir);

    const res = await request(app)
      .get("/api/browse/sqlite-table")
      .query({ path: "notes.txt", table: "users" });

    expect(res.status).toBe(400);
    expect(res.body).toEqual({ ok: false, error: "Path is not a sqlite file" });
  });

  it("requires a table name", async () => {
    let DatabaseSync = null;
    try {
      ({ DatabaseSync } = require("node:sqlite"));
    } catch {
      return;
    }
    const rootDir = createTestRoot();
    const dbPath = path.join(rootDir, "empty.sqlite");
    const database = new DatabaseSync(dbPath);
    database.close();
    const app = createApp(rootDir);

    const res = await request(app)
      .get("/api/browse/sqlite-table")
      .query({ path: "empty.sqlite" });

    expect(res.status).toBe(400);
    expect(res.body).toEqual({ ok: false, error: "table is required" });
  });

  it("returns table-not-found for unknown tables", async () => {
    let DatabaseSync = null;
    try {
      ({ DatabaseSync } = require("node:sqlite"));
    } catch {
      return;
    }
    const rootDir = createTestRoot();
    const dbPath = path.join(rootDir, "known.sqlite");
    const database = new DatabaseSync(dbPath);
    database.exec("CREATE TABLE t (a TEXT)");
    database.close();
    const app = createApp(rootDir);

    const res = await request(app)
      .get("/api/browse/sqlite-table")
      .query({ path: "known.sqlite", table: "nope" });

    expect(res.status).toBe(400);
    expect(res.body).toEqual({ ok: false, error: "table not found" });
  });

  const createCorruptDb = (rootDir, fileName) => {
    let DatabaseSync = null;
    try {
      ({ DatabaseSync } = require("node:sqlite"));
    } catch {
      return false;
    }
    const dbPath = path.join(rootDir, fileName);
    const database = new DatabaseSync(dbPath);
    database.exec("PRAGMA page_size=512");
    database.exec("CREATE TABLE t (a TEXT)");
    database.exec("INSERT INTO t VALUES ('hello'), ('world')");
    database.close();
    const bytes = fs.readFileSync(dbPath);
    // Keep page 1 (schema) intact, corrupt page 2 (table data).
    bytes.fill(0xff, 512, 1024);
    fs.writeFileSync(dbPath, bytes);
    return true;
  };

  it("returns empty sample rows when table data cannot be read", async () => {
    const rootDir = createTestRoot();
    if (!createCorruptDb(rootDir, "corrupt.sqlite")) return;
    const app = createApp(rootDir);

    const res = await request(app)
      .get("/api/browse/read")
      .query({ path: "corrupt.sqlite" });

    expect(res.status).toBe(200);
    expect(res.body.kind).toBe("sqlite");
    const tableEntry = res.body.sqliteSummary.objects.find(
      (entry) => entry.name === "t",
    );
    expect(tableEntry.sampleRows).toEqual([]);
  });

  it("returns an error when sqlite table rows cannot be read", async () => {
    const rootDir = createTestRoot();
    if (!createCorruptDb(rootDir, "corrupt-rows.sqlite")) return;
    const app = createApp(rootDir);

    const res = await request(app)
      .get("/api/browse/sqlite-table")
      .query({ path: "corrupt-rows.sqlite", table: "t" });

    expect(res.status).toBe(400);
    expect(res.body.ok).toBe(false);
    expect(res.body.error).toContain("malformed");
  });
});

describe("server/routes/browse git-summary", () => {
  let savedWorkspaceRepo;

  beforeEach(() => {
    savedWorkspaceRepo = process.env.GITHUB_WORKSPACE_REPO;
    delete process.env.GITHUB_WORKSPACE_REPO;
  });

  afterEach(() => {
    if (savedWorkspaceRepo === undefined) {
      delete process.env.GITHUB_WORKSPACE_REPO;
    } else {
      process.env.GITHUB_WORKSPACE_REPO = savedWorkspaceRepo;
    }
  });

  it("returns 500 when git status fails for non-repo reasons", async () => {
    const rootDir = createTestRoot();
    fs.writeFileSync(path.join(rootDir, ".git"), "garbage\n", "utf8");
    const app = createApp(rootDir);

    const res = await request(app).get("/api/browse/git-summary");

    expect(res.status).toBe(500);
    expect(res.body.ok).toBe(false);
    expect(res.body.error).toContain("invalid gitfile format");
  });

  it("summarizes a dirty repo with remote, changes, and commits", async () => {
    const rootDir = createTestRoot();
    const app = createApp(rootDir);
    fs.writeFileSync(path.join(rootDir, "a.txt"), "one\ntwo\n", "utf8");
    fs.writeFileSync(path.join(rootDir, "del.txt"), "bye\n", "utf8");
    initRepo(rootDir);
    runGit(rootDir, "add .");
    runGit(rootDir, 'commit -q -m "initial commit"');
    runGit(rootDir, "remote add origin git@github.com:acme/widgets.git");
    fs.writeFileSync(path.join(rootDir, "a.txt"), "one\nchanged\nthree\n", "utf8");
    fs.rmSync(path.join(rootDir, "del.txt"));
    fs.writeFileSync(path.join(rootDir, "new.txt"), "fresh\n", "utf8");
    fs.writeFileSync(path.join(rootDir, "added.txt"), "staged\n", "utf8");
    runGit(rootDir, "add added.txt");

    const res = await request(app).get("/api/browse/git-summary");

    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(res.body.isRepo).toBe(true);
    expect(res.body.branch).toBe("main");
    expect(res.body.repoSlug).toBe("acme/widgets");
    expect(res.body.repoUrl).toBe("https://github.com/acme/widgets");
    expect(res.body.hasUpstream).toBe(false);
    expect(res.body.syncState).toBe("no-upstream");
    expect(res.body.isDirty).toBe(true);
    expect(res.body.changedFilesCount).toBe(4);
    const byPath = new Map(
      res.body.changedFiles.map((entry) => [entry.path, entry]),
    );
    expect(byPath.get("a.txt").statusKind).toBe("M");
    expect(byPath.get("a.txt").addedLines).toBe(2);
    expect(byPath.get("a.txt").deletedLines).toBe(1);
    expect(byPath.get("del.txt").statusKind).toBe("D");
    expect(byPath.get("new.txt").statusKind).toBe("U");
    expect(byPath.get("added.txt").statusKind).toBe("U");
    expect(res.body.commits.length).toBe(1);
    expect(res.body.commits[0].message).toBe("initial commit");
    expect(res.body.commits[0].url).toContain(
      "https://github.com/acme/widgets/commit/",
    );
    expect(res.body.commits[0].timestamp).toBeGreaterThan(0);
  });

  it("prefers the GITHUB_WORKSPACE_REPO env slug", async () => {
    const rootDir = createTestRoot();
    const app = createApp(rootDir);
    fs.writeFileSync(path.join(rootDir, "a.txt"), "hi\n", "utf8");
    initRepo(rootDir);
    runGit(rootDir, "add .");
    runGit(rootDir, 'commit -q -m "env commit"');
    process.env.GITHUB_WORKSPACE_REPO =
      "https://github.com/env-owner/env-repo.git";

    const res = await request(app).get("/api/browse/git-summary");

    expect(res.status).toBe(200);
    expect(res.body.repoSlug).toBe("env-owner/env-repo");
    expect(res.body.commits[0].url).toContain(
      "https://github.com/env-owner/env-repo/commit/",
    );
  });

  it("handles repos with no commits and no remote", async () => {
    const rootDir = createTestRoot();
    const app = createApp(rootDir);
    initRepo(rootDir);
    fs.writeFileSync(path.join(rootDir, "untracked.txt"), "hi\n", "utf8");

    const res = await request(app).get("/api/browse/git-summary");

    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(res.body.isRepo).toBe(true);
    expect(res.body.repoSlug).toBe("");
    expect(res.body.repoUrl).toBe("");
    expect(res.body.commits).toEqual([]);
    expect(res.body.isDirty).toBe(true);
  });
});

describe("server/routes/browse git-diff", () => {
  it("requires a non-empty path", async () => {
    const rootDir = createTestRoot();
    const app = createApp(rootDir);

    const res = await request(app).get("/api/browse/git-diff");

    expect(res.status).toBe(400);
    expect(res.body).toEqual({ ok: false, error: "path is required" });
  });

  it("rejects diffs outside git repositories", async () => {
    const rootDir = createTestRoot();
    fs.writeFileSync(path.join(rootDir, "file.txt"), "hi\n", "utf8");
    const app = createApp(rootDir);

    const res = await request(app)
      .get("/api/browse/git-diff")
      .query({ path: "file.txt" });

    expect(res.status).toBe(400);
    expect(res.body).toEqual({ ok: false, error: "No git repo at this root" });
  });

  it("returns diffs for modified tracked files", async () => {
    const rootDir = createTestRoot();
    const app = createApp(rootDir);
    fs.writeFileSync(path.join(rootDir, "a.txt"), "before\n", "utf8");
    initRepo(rootDir);
    runGit(rootDir, "add .");
    runGit(rootDir, 'commit -q -m "initial"');
    fs.writeFileSync(path.join(rootDir, "a.txt"), "after\n", "utf8");

    const res = await request(app)
      .get("/api/browse/git-diff")
      .query({ path: "a.txt" });

    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(res.body.path).toBe("a.txt");
    expect(res.body.statusKind).toBe("M");
    expect(res.body.isDeleted).toBe(false);
    expect(res.body.content).toContain("diff --git");
    expect(res.body.content).toContain("+after");
  });

  it("returns diffs for untracked files via no-index", async () => {
    const rootDir = createTestRoot();
    const app = createApp(rootDir);
    fs.writeFileSync(path.join(rootDir, "a.txt"), "committed\n", "utf8");
    initRepo(rootDir);
    runGit(rootDir, "add .");
    runGit(rootDir, 'commit -q -m "initial"');
    fs.writeFileSync(path.join(rootDir, "new.txt"), "fresh\n", "utf8");

    const res = await request(app)
      .get("/api/browse/git-diff")
      .query({ path: "new.txt" });

    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(res.body.statusKind).toBe("U");
    expect(res.body.isDeleted).toBe(false);
    expect(res.body.content).toContain("+fresh");
    expect(res.body.content).not.toContain(rootDir);
  });

  it("marks deleted tracked files in diffs", async () => {
    const rootDir = createTestRoot();
    const app = createApp(rootDir);
    fs.writeFileSync(path.join(rootDir, "gone.txt"), "bye\n", "utf8");
    initRepo(rootDir);
    runGit(rootDir, "add .");
    runGit(rootDir, 'commit -q -m "initial"');
    fs.rmSync(path.join(rootDir, "gone.txt"));

    const res = await request(app)
      .get("/api/browse/git-diff")
      .query({ path: "gone.txt" });

    expect(res.status).toBe(200);
    expect(res.body.statusKind).toBe("D");
    expect(res.body.isDeleted).toBe(true);
    expect(res.body.content).toContain("-bye");
  });

  it("returns 500 when the diff command fails", async () => {
    const rootDir = createTestRoot();
    const app = createApp(rootDir);
    initRepo(rootDir);
    fs.writeFileSync(path.join(rootDir, "staged.txt"), "hi\n", "utf8");
    runGit(rootDir, "add staged.txt");

    const res = await request(app)
      .get("/api/browse/git-diff")
      .query({ path: "staged.txt" });

    expect(res.status).toBe(500);
    expect(res.body.ok).toBe(false);
    expect(res.body.error).toBeTruthy();
  });
});

describe("server/routes/browse git-sync", () => {
  it("returns 500 when git status fails for non-repo reasons", async () => {
    const rootDir = createTestRoot();
    fs.writeFileSync(path.join(rootDir, ".git"), "garbage\n", "utf8");
    const app = createApp(rootDir);

    const res = await request(app).post("/api/browse/git-sync").send({});

    expect(res.status).toBe(500);
    expect(res.body.ok).toBe(false);
    expect(res.body.error).toContain("invalid gitfile format");
  });

  it("reports no changes for clean repos without upstream", async () => {
    const rootDir = createTestRoot();
    const app = createApp(rootDir);
    fs.writeFileSync(path.join(rootDir, "a.txt"), "hi\n", "utf8");
    initRepo(rootDir);
    runGit(rootDir, "add .");
    runGit(rootDir, 'commit -q -m "initial"');

    const res = await request(app).post("/api/browse/git-sync").send({});

    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      ok: true,
      committed: false,
      pushed: false,
      message: "No changes to sync",
    });
  });

  it("commits locally and reports push failure without a remote", async () => {
    const rootDir = createTestRoot();
    const app = createApp(rootDir);
    fs.writeFileSync(path.join(rootDir, "a.txt"), "hi\n", "utf8");
    initRepo(rootDir);
    runGit(rootDir, "add .");
    runGit(rootDir, 'commit -q -m "initial"');
    fs.writeFileSync(path.join(rootDir, "a.txt"), "changed\n", "utf8");

    const res = await request(app)
      .post("/api/browse/git-sync")
      .send({ message: "local sync" });

    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(res.body.committed).toBe(true);
    expect(res.body.pushed).toBe(false);
    expect(res.body.shortHash).toBeTruthy();
    expect(res.body.message).toContain("locally; push failed");
    expect(res.body.pushError).toBeTruthy();
    expect(runGit(rootDir, "log -1 --pretty=%s")).toBe("local sync");
  });

  const setupRepoWithRemote = () => {
    const baseDir = createTestRoot();
    const remoteDir = path.join(baseDir, "origin.git");
    const rootDir = path.join(baseDir, "work");
    fs.mkdirSync(remoteDir, { recursive: true });
    fs.mkdirSync(rootDir, { recursive: true });
    runGit(remoteDir, "init -q --bare");
    fs.writeFileSync(path.join(rootDir, "a.txt"), "hi\n", "utf8");
    initRepo(rootDir);
    runGit(rootDir, "add .");
    runGit(rootDir, 'commit -q -m "initial"');
    runGit(rootDir, `remote add origin "${remoteDir}"`);
    runGit(rootDir, "push -q -u origin main");
    return { rootDir, remoteDir };
  };

  it("pushes existing local commits when the tree is clean but ahead", async () => {
    const { rootDir } = setupRepoWithRemote();
    const app = createApp(rootDir);
    fs.writeFileSync(path.join(rootDir, "b.txt"), "second\n", "utf8");
    runGit(rootDir, "add b.txt");
    runGit(rootDir, 'commit -q -m "second"');

    const res = await request(app).post("/api/browse/git-sync").send({});

    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      ok: true,
      committed: false,
      pushed: true,
      shortHash: "",
      message: "Pushed local commits",
    });
  });

  it("commits and pushes dirty changes with an upstream", async () => {
    const { rootDir } = setupRepoWithRemote();
    const app = createApp(rootDir);
    fs.writeFileSync(path.join(rootDir, "a.txt"), "changed\n", "utf8");

    const res = await request(app)
      .post("/api/browse/git-sync")
      .send({ message: "remote sync" });

    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(res.body.committed).toBe(true);
    expect(res.body.pushed).toBe(true);
    expect(res.body.shortHash).toBeTruthy();
    expect(res.body.message).toBe(
      `Committed and pushed ${res.body.shortHash}`,
    );
  });

  it("reports push failure for ahead commits when the remote is gone", async () => {
    const { rootDir, remoteDir } = setupRepoWithRemote();
    const app = createApp(rootDir);
    fs.writeFileSync(path.join(rootDir, "b.txt"), "second\n", "utf8");
    runGit(rootDir, "add b.txt");
    runGit(rootDir, 'commit -q -m "second"');
    fs.rmSync(remoteDir, { recursive: true, force: true });

    const res = await request(app).post("/api/browse/git-sync").send({});

    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(res.body.committed).toBe(false);
    expect(res.body.pushed).toBe(false);
    expect(res.body.message).toBe("Could not push commits");
    expect(res.body.pushError).toBeTruthy();
  });
});

describe("server/routes/browse write edge cases", () => {
  it("rejects path traversal on write", async () => {
    const rootDir = createTestRoot();
    const app = createApp(rootDir);

    const res = await request(app)
      .put("/api/browse/write")
      .send({ path: "../outside.txt", content: "x" });

    expect(res.status).toBe(400);
    expect(res.body.error).toContain("Path must stay within");
  });

  it("rejects non-string content", async () => {
    const rootDir = createTestRoot();
    fs.writeFileSync(path.join(rootDir, "f.txt"), "hi\n", "utf8");
    const app = createApp(rootDir);

    const res = await request(app)
      .put("/api/browse/write")
      .send({ path: "f.txt", content: 42 });

    expect(res.status).toBe(400);
    expect(res.body).toEqual({ ok: false, error: "content must be a string" });
  });

  it("rejects writes to directories", async () => {
    const rootDir = createTestRoot();
    fs.mkdirSync(path.join(rootDir, "folder"));
    const app = createApp(rootDir);

    const res = await request(app)
      .put("/api/browse/write")
      .send({ path: "folder", content: "x" });

    expect(res.status).toBe(400);
    expect(res.body).toEqual({ ok: false, error: "Path is not a file" });
  });

  it("returns 500 when the write target does not exist", async () => {
    const rootDir = createTestRoot();
    const app = createApp(rootDir);

    const res = await request(app)
      .put("/api/browse/write")
      .send({ path: "missing.txt", content: "x" });

    expect(res.status).toBe(500);
    expect(res.body.ok).toBe(false);
  });
});

describe("server/routes/browse create-file", () => {
  it("requires a path", async () => {
    const rootDir = createTestRoot();
    const app = createApp(rootDir);

    const res = await request(app).post("/api/browse/create-file").send({});

    expect(res.status).toBe(400);
    expect(res.body).toEqual({ ok: false, error: "path is required" });
  });

  it("rejects path traversal", async () => {
    const rootDir = createTestRoot();
    const app = createApp(rootDir);

    const res = await request(app)
      .post("/api/browse/create-file")
      .send({ path: "../outside.txt" });

    expect(res.status).toBe(400);
    expect(res.body.error).toContain("Path must stay within");
  });

  it("rejects creation in locked paths", async () => {
    const rootDir = createTestRoot();
    const app = createApp(rootDir);

    const res = await request(app)
      .post("/api/browse/create-file")
      .send({ path: "skills/gog-cli/new.txt" });

    expect(res.status).toBe(403);
    expect(res.body).toEqual({
      ok: false,
      error: "Cannot create files in a locked path.",
    });
  });

  it("rejects creation over existing paths", async () => {
    const rootDir = createTestRoot();
    fs.writeFileSync(path.join(rootDir, "exists.txt"), "hi\n", "utf8");
    const app = createApp(rootDir);

    const res = await request(app)
      .post("/api/browse/create-file")
      .send({ path: "exists.txt" });

    expect(res.status).toBe(409);
    expect(res.body).toEqual({
      ok: false,
      error: "A file or folder already exists at this path",
    });
  });

  it("creates empty files with parent directories", async () => {
    const rootDir = createTestRoot();
    const app = createApp(rootDir);

    const res = await request(app)
      .post("/api/browse/create-file")
      .send({ path: "nested/dir/new.txt" });

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ ok: true, path: "nested/dir/new.txt" });
    expect(fs.readFileSync(path.join(rootDir, "nested/dir/new.txt"), "utf8")).toBe(
      "",
    );
  });

  it("returns 500 when a parent path is a file", async () => {
    const rootDir = createTestRoot();
    fs.writeFileSync(path.join(rootDir, "blocker.txt"), "hi\n", "utf8");
    const app = createApp(rootDir);

    const res = await request(app)
      .post("/api/browse/create-file")
      .send({ path: "blocker.txt/child.txt" });

    expect(res.status).toBe(500);
    expect(res.body.ok).toBe(false);
  });
});

describe("server/routes/browse create-folder", () => {
  it("requires a path", async () => {
    const rootDir = createTestRoot();
    const app = createApp(rootDir);

    const res = await request(app).post("/api/browse/create-folder").send({});

    expect(res.status).toBe(400);
    expect(res.body).toEqual({ ok: false, error: "path is required" });
  });

  it("rejects path traversal", async () => {
    const rootDir = createTestRoot();
    const app = createApp(rootDir);

    const res = await request(app)
      .post("/api/browse/create-folder")
      .send({ path: "../outside" });

    expect(res.status).toBe(400);
    expect(res.body.error).toContain("Path must stay within");
  });

  it("rejects creation in locked paths", async () => {
    const rootDir = createTestRoot();
    const app = createApp(rootDir);

    const res = await request(app)
      .post("/api/browse/create-folder")
      .send({ path: "skills/gog-cli/subdir" });

    expect(res.status).toBe(403);
    expect(res.body).toEqual({
      ok: false,
      error: "Cannot create folders in a locked path.",
    });
  });

  it("rejects creation over existing paths", async () => {
    const rootDir = createTestRoot();
    fs.mkdirSync(path.join(rootDir, "exists"));
    const app = createApp(rootDir);

    const res = await request(app)
      .post("/api/browse/create-folder")
      .send({ path: "exists" });

    expect(res.status).toBe(409);
    expect(res.body).toEqual({
      ok: false,
      error: "A file or folder already exists at this path",
    });
  });

  it("creates nested folders", async () => {
    const rootDir = createTestRoot();
    const app = createApp(rootDir);

    const res = await request(app)
      .post("/api/browse/create-folder")
      .send({ path: "nested/newdir" });

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ ok: true, path: "nested/newdir" });
    expect(fs.statSync(path.join(rootDir, "nested/newdir")).isDirectory()).toBe(
      true,
    );
  });

  it("returns 500 when a parent path is a file", async () => {
    const rootDir = createTestRoot();
    fs.writeFileSync(path.join(rootDir, "blocker.txt"), "hi\n", "utf8");
    const app = createApp(rootDir);

    const res = await request(app)
      .post("/api/browse/create-folder")
      .send({ path: "blocker.txt/subdir" });

    expect(res.status).toBe(500);
    expect(res.body.ok).toBe(false);
  });
});

describe("server/routes/browse move", () => {
  it("requires from and to", async () => {
    const rootDir = createTestRoot();
    const app = createApp(rootDir);

    const res = await request(app)
      .post("/api/browse/move")
      .send({ from: "only-from.txt" });

    expect(res.status).toBe(400);
    expect(res.body).toEqual({ ok: false, error: "from and to are required" });
  });

  it("rejects traversal in the source path", async () => {
    const rootDir = createTestRoot();
    const app = createApp(rootDir);

    const res = await request(app)
      .post("/api/browse/move")
      .send({ from: "../outside.txt", to: "in.txt" });

    expect(res.status).toBe(400);
    expect(res.body.error).toContain("Path must stay within");
  });

  it("rejects traversal in the destination path", async () => {
    const rootDir = createTestRoot();
    const app = createApp(rootDir);

    const res = await request(app)
      .post("/api/browse/move")
      .send({ from: "in.txt", to: "../outside.txt" });

    expect(res.status).toBe(400);
    expect(res.body.error).toContain("Path must stay within");
  });

  it("rejects moving protected paths", async () => {
    const rootDir = createTestRoot();
    fs.writeFileSync(path.join(rootDir, "openclaw.json"), "{}\n", "utf8");
    const app = createApp(rootDir);

    const res = await request(app)
      .post("/api/browse/move")
      .send({ from: "openclaw.json", to: "renamed.json" });

    expect(res.status).toBe(403);
    expect(res.body).toEqual({
      ok: false,
      error: "Source path is protected and cannot be moved.",
    });
  });

  it("rejects moving locked paths", async () => {
    const rootDir = createTestRoot();
    const app = createApp(rootDir);

    const res = await request(app)
      .post("/api/browse/move")
      .send({ from: "hooks/bootstrap/AGENTS.md", to: "AGENTS-copy.md" });

    expect(res.status).toBe(403);
    expect(res.body).toEqual({
      ok: false,
      error: "Source path is protected and cannot be moved.",
    });
  });

  it("rejects moving into locked paths", async () => {
    const rootDir = createTestRoot();
    fs.writeFileSync(path.join(rootDir, "note.txt"), "hi\n", "utf8");
    const app = createApp(rootDir);

    const res = await request(app)
      .post("/api/browse/move")
      .send({ from: "note.txt", to: "skills/gog-cli/note.txt" });

    expect(res.status).toBe(403);
    expect(res.body).toEqual({
      ok: false,
      error: "Cannot move into a locked path.",
    });
  });

  it("returns 404 when the source does not exist", async () => {
    const rootDir = createTestRoot();
    const app = createApp(rootDir);

    const res = await request(app)
      .post("/api/browse/move")
      .send({ from: "missing.txt", to: "dest.txt" });

    expect(res.status).toBe(404);
    expect(res.body).toEqual({ ok: false, error: "Source path does not exist" });
  });

  it("returns 409 when the destination exists", async () => {
    const rootDir = createTestRoot();
    fs.writeFileSync(path.join(rootDir, "src.txt"), "src\n", "utf8");
    fs.writeFileSync(path.join(rootDir, "dst.txt"), "dst\n", "utf8");
    const app = createApp(rootDir);

    const res = await request(app)
      .post("/api/browse/move")
      .send({ from: "src.txt", to: "dst.txt" });

    expect(res.status).toBe(409);
    expect(res.body).toEqual({
      ok: false,
      error: "A file or folder already exists at the destination",
    });
  });

  it("moves files into new directories", async () => {
    const rootDir = createTestRoot();
    fs.writeFileSync(path.join(rootDir, "m1.txt"), "payload\n", "utf8");
    const app = createApp(rootDir);

    const res = await request(app)
      .post("/api/browse/move")
      .send({ from: "m1.txt", to: "sub/m2.txt" });

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ ok: true, from: "m1.txt", to: "sub/m2.txt" });
    expect(fs.existsSync(path.join(rootDir, "m1.txt"))).toBe(false);
    expect(fs.readFileSync(path.join(rootDir, "sub/m2.txt"), "utf8")).toBe(
      "payload\n",
    );
  });

  it("returns 500 when the rename fails", async () => {
    const rootDir = createTestRoot();
    fs.mkdirSync(path.join(rootDir, "mvdir"));
    const app = createApp(rootDir);

    const res = await request(app)
      .post("/api/browse/move")
      .send({ from: "mvdir", to: "mvdir/inner" });

    expect(res.status).toBe(500);
    expect(res.body.ok).toBe(false);
  });
});

describe("server/routes/browse delete edge cases", () => {
  it("rejects path traversal on delete", async () => {
    const rootDir = createTestRoot();
    const app = createApp(rootDir);

    const res = await request(app)
      .delete("/api/browse/delete")
      .send({ path: "../outside.txt" });

    expect(res.status).toBe(400);
    expect(res.body.error).toContain("Path must stay within");
  });

  it("returns 404 for missing paths", async () => {
    const rootDir = createTestRoot();
    const app = createApp(rootDir);

    const res = await request(app)
      .delete("/api/browse/delete")
      .send({ path: "missing.txt" });

    expect(res.status).toBe(404);
    expect(res.body).toEqual({ ok: false, error: "Path does not exist" });
  });

  it("rejects paths that are neither files nor folders", async () => {
    const rootDir = createTestRoot();
    const fifoPath = path.join(rootDir, "pipe.fifo");
    try {
      execSync(`mkfifo "${fifoPath}"`);
    } catch {
      // mkfifo unavailable on this platform.
      return;
    }
    const app = createApp(rootDir);

    const res = await request(app)
      .delete("/api/browse/delete")
      .send({ path: "pipe.fifo" });

    expect(res.status).toBe(400);
    expect(res.body).toEqual({
      ok: false,
      error: "Path is not a file or folder",
    });
  });

  it("returns 500 when deletion fails", async () => {
    if (typeof process.getuid === "function" && process.getuid() === 0) {
      return;
    }
    const rootDir = createTestRoot();
    const lockedDir = path.join(rootDir, "ro");
    fs.mkdirSync(lockedDir);
    fs.writeFileSync(path.join(lockedDir, "child.txt"), "hi\n", "utf8");
    fs.chmodSync(lockedDir, 0o555);
    const app = createApp(rootDir);

    try {
      const res = await request(app)
        .delete("/api/browse/delete")
        .send({ path: "ro/child.txt" });

      expect(res.status).toBe(500);
      expect(res.body.ok).toBe(false);
    } finally {
      fs.chmodSync(lockedDir, 0o755);
    }
  });
});

describe("server/routes/browse restore edge cases", () => {
  it("rejects path traversal on restore", async () => {
    const rootDir = createTestRoot();
    const app = createApp(rootDir);

    const res = await request(app)
      .post("/api/browse/restore")
      .send({ path: "../outside.txt" });

    expect(res.status).toBe(400);
    expect(res.body.error).toContain("Path must stay within");
  });

  it("requires a non-empty path", async () => {
    const rootDir = createTestRoot();
    const app = createApp(rootDir);

    const res = await request(app)
      .post("/api/browse/restore")
      .send({ path: "" });

    expect(res.status).toBe(400);
    expect(res.body).toEqual({ ok: false, error: "path is required" });
  });

  it("returns 500 when both restore and checkout fail", async () => {
    const rootDir = createTestRoot();
    const app = createApp(rootDir);
    fs.writeFileSync(path.join(rootDir, "a.txt"), "hi\n", "utf8");
    initRepo(rootDir);
    runGit(rootDir, "add .");
    runGit(rootDir, 'commit -q -m "initial"');

    const res = await request(app)
      .post("/api/browse/restore")
      .send({ path: "never-tracked.txt" });

    expect(res.status).toBe(500);
    expect(res.body.ok).toBe(false);
    expect(res.body.error).toContain("pathspec");
  });
});

describe("server/routes/browse git helpers", () => {
  const {
    runGitCommand,
    runGitCommandWithExitCode,
    parseGithubRepoSlug,
    normalizeChangedPath,
    parseBranchTracking,
  } = require("../../lib/server/routes/browse/git");

  it("parses github repo slugs from ssh and https urls", () => {
    expect(parseGithubRepoSlug("")).toBe("");
    expect(parseGithubRepoSlug("git@github.com:acme/widgets.git")).toBe(
      "acme/widgets",
    );
    expect(parseGithubRepoSlug("https://github.com/acme/widgets")).toBe(
      "acme/widgets",
    );
  });

  it("normalizes changed paths including renames", () => {
    expect(normalizeChangedPath("")).toBe("");
    expect(normalizeChangedPath("plain.txt")).toBe("plain.txt");
    expect(normalizeChangedPath("old.txt -> new.txt")).toBe("new.txt");
  });

  it("parses branch tracking states", () => {
    expect(parseBranchTracking("")).toEqual(
      expect.objectContaining({
        branch: "unknown",
        hasUpstream: false,
        syncState: "no-upstream",
      }),
    );
    expect(parseBranchTracking("## main...origin/main")).toEqual(
      expect.objectContaining({
        branch: "main",
        upstreamBranch: "origin/main",
        hasUpstream: true,
        syncState: "up-to-date",
      }),
    );
    expect(parseBranchTracking("## main...origin/main [ahead 2]")).toEqual(
      expect.objectContaining({ aheadCount: 2, syncState: "ahead" }),
    );
    expect(parseBranchTracking("## main...origin/main [behind 3]")).toEqual(
      expect.objectContaining({ behindCount: 3, syncState: "behind" }),
    );
    expect(
      parseBranchTracking("## main...origin/main [ahead 1, behind 2]"),
    ).toEqual(
      expect.objectContaining({
        aheadCount: 1,
        behindCount: 2,
        syncState: "diverged",
      }),
    );
    expect(parseBranchTracking("## main...origin/main [gone]")).toEqual(
      expect.objectContaining({
        upstreamGone: true,
        syncState: "upstream-gone",
      }),
    );
  });

  it("runs git commands and reports success and failure", async () => {
    const rootDir = createTestRoot();
    const versionResult = await runGitCommandWithExitCode(
      ["--version"],
      rootDir,
    );
    expect(versionResult.ok).toBe(true);
    expect(versionResult.exitCode).toBe(0);
    expect(versionResult.stdout).toContain("git version");

    const failResult = await runGitCommand(["definitely-not-a-command"], rootDir);
    expect(failResult.ok).toBe(false);
    expect(failResult.error).toBeTruthy();
  });

  it("normalizes non-integer exit codes from spawn failures", async () => {
    const result = await runGitCommandWithExitCode(
      ["status"],
      path.join(os.tmpdir(), "alphaclaw-definitely-missing-cwd"),
    );
    expect(result.ok).toBe(false);
    expect(result.exitCode).toBe(1);
    expect(result.error).toBeTruthy();
  });
});
