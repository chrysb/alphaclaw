const fs = require("fs");
const os = require("os");
const path = require("path");
const express = require("express");
const request = require("supertest");

const gitModule = require("../../lib/server/routes/browse/git");

const realRunGitCommand = gitModule.runGitCommand;
const realRunGitCommandWithExitCode = gitModule.runGitCommandWithExitCode;

let runGitCommandImpl = realRunGitCommand;
let runGitCommandWithExitCodeImpl = realRunGitCommandWithExitCode;

// The browse route module destructures these functions at require time, so
// swap in delegating wrappers before it loads. The wrappers fall back to the
// real implementations outside of the tests in this file.
gitModule.runGitCommand = (...args) => runGitCommandImpl(...args);
gitModule.runGitCommandWithExitCode = (...args) =>
  runGitCommandWithExitCodeImpl(...args);

const { registerBrowseRoutes } = require("../../lib/server/routes/browse");

const createTestRoot = () =>
  fs.mkdtempSync(path.join(os.tmpdir(), "alphaclaw-browse-gitmock-"));

const createApp = (kRootDir) => {
  const app = express();
  app.use(express.json());
  registerBrowseRoutes({ app, fs, kRootDir });
  return app;
};

afterEach(() => {
  runGitCommandImpl = realRunGitCommand;
  runGitCommandWithExitCodeImpl = realRunGitCommandWithExitCode;
});

afterAll(() => {
  gitModule.runGitCommand = realRunGitCommand;
  gitModule.runGitCommandWithExitCode = realRunGitCommandWithExitCode;
});

describe("server/routes/browse with failing git layer", () => {
  it("returns 500 when git-summary throws unexpectedly", async () => {
    const app = createApp(createTestRoot());
    runGitCommandImpl = async () => {
      throw new Error("summary exploded");
    };

    const res = await request(app).get("/api/browse/git-summary");

    expect(res.status).toBe(500);
    expect(res.body).toEqual({ ok: false, error: "summary exploded" });
  });

  it("returns 500 when git-diff throws unexpectedly", async () => {
    const rootDir = createTestRoot();
    fs.writeFileSync(path.join(rootDir, "file.txt"), "hi\n", "utf8");
    const app = createApp(rootDir);
    runGitCommandWithExitCodeImpl = async () => {
      throw new Error("diff exploded");
    };

    const res = await request(app)
      .get("/api/browse/git-diff")
      .query({ path: "file.txt" });

    expect(res.status).toBe(500);
    expect(res.body).toEqual({ ok: false, error: "diff exploded" });
  });

  it("returns 500 when git-sync throws unexpectedly", async () => {
    const app = createApp(createTestRoot());
    runGitCommandImpl = async () => {
      throw new Error("sync exploded");
    };

    const res = await request(app).post("/api/browse/git-sync").send({});

    expect(res.status).toBe(500);
    expect(res.body).toEqual({ ok: false, error: "sync exploded" });
  });

  const stubGitSequence = (handlers) => {
    runGitCommandImpl = async (args) => {
      const command = args[0];
      if (handlers[command]) return handlers[command](args);
      throw new Error(`unexpected git command: ${command}`);
    };
  };

  it("returns 500 when staging fails during git-sync", async () => {
    const app = createApp(createTestRoot());
    stubGitSequence({
      status: async () => ({ ok: true, stdout: "## main\n M file.txt\n" }),
      add: async () => ({ ok: false, error: "add failed" }),
    });

    const res = await request(app).post("/api/browse/git-sync").send({});

    expect(res.status).toBe(500);
    expect(res.body).toEqual({ ok: false, error: "add failed" });
  });

  it("treats nothing-to-commit commit failures as no changes", async () => {
    const app = createApp(createTestRoot());
    stubGitSequence({
      status: async () => ({ ok: true, stdout: "## main\n M file.txt\n" }),
      add: async () => ({ ok: true, stdout: "" }),
      commit: async () => ({
        ok: false,
        error: "nothing to commit, working tree clean",
      }),
    });

    const res = await request(app).post("/api/browse/git-sync").send({});

    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      ok: true,
      committed: false,
      pushed: false,
      message: "No changes to sync",
    });
  });

  it("returns 500 for other commit failures during git-sync", async () => {
    const app = createApp(createTestRoot());
    stubGitSequence({
      status: async () => ({ ok: true, stdout: "## main\n M file.txt\n" }),
      add: async () => ({ ok: true, stdout: "" }),
      commit: async () => ({ ok: false, error: "commit exploded" }),
    });

    const res = await request(app).post("/api/browse/git-sync").send({});

    expect(res.status).toBe(500);
    expect(res.body).toEqual({ ok: false, error: "commit exploded" });
  });

  it("falls back to empty short hash when rev-parse fails", async () => {
    const app = createApp(createTestRoot());
    stubGitSequence({
      status: async () => ({
        ok: true,
        stdout: "## main...origin/main\n M file.txt\n",
      }),
      add: async () => ({ ok: true, stdout: "" }),
      commit: async () => ({ ok: true, stdout: "" }),
      "rev-parse": async () => ({ ok: false, error: "rev-parse failed" }),
      push: async () => ({ ok: true, stdout: "" }),
    });

    const res = await request(app).post("/api/browse/git-sync").send({});

    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      ok: true,
      committed: true,
      pushed: true,
      shortHash: "",
      message: "Committed and pushed changes",
    });
  });

  it("reports commit-only success when nothing needs pushing upstream", async () => {
    const app = createApp(createTestRoot());
    stubGitSequence({
      status: async () => ({ ok: true, stdout: "## main\n M file.txt\n" }),
      add: async () => ({ ok: true, stdout: "" }),
      commit: async () => ({ ok: true, stdout: "" }),
      "rev-parse": async () => ({ ok: true, stdout: "abc1234\n" }),
      push: async () => ({ ok: false, error: "no remote" }),
    });

    const res = await request(app).post("/api/browse/git-sync").send({});

    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      ok: true,
      committed: true,
      pushed: false,
      shortHash: "abc1234",
      message: "Committed abc1234 locally; push failed",
      pushError: "no remote",
    });
  });
});
