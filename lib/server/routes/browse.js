const path = require("path");
const { execFile } = require("child_process");

const kDefaultTreeDepth = 10;
const kIgnoredDirectoryNames = new Set([
  ".git",
  "node_modules",
  ".cache",
  "dist",
  "build",
]);

const registerBrowseRoutes = ({ app, fs, kRootDir }) => {
  const kRootResolved = path.resolve(kRootDir);
  const kRootWithSep = `${kRootResolved}${path.sep}`;
  const kRootDisplayName = "kRootDir/.openclaw";

  if (!fs.existsSync(kRootResolved)) {
    fs.mkdirSync(kRootResolved, { recursive: true });
  }

  const normalizeRelativePath = (inputPath) => {
    const rawPath = String(inputPath || "").trim();
    if (!rawPath) return "";
    return rawPath.replace(/\\/g, "/").replace(/^\/+/, "");
  };

  const resolveSafePath = (inputPath) => {
    const relativePath = normalizeRelativePath(inputPath);
    const absolutePath = path.resolve(kRootResolved, relativePath);
    const isInsideRoot =
      absolutePath === kRootResolved || absolutePath.startsWith(kRootWithSep);
    if (!isInsideRoot) {
      return { ok: false, error: `Path must stay within ${kRootDisplayName}` };
    }
    return { ok: true, relativePath, absolutePath };
  };

  const isLikelyBinaryFile = (targetPath) => {
    let fileHandle = null;
    try {
      fileHandle = fs.openSync(targetPath, "r");
      const sample = Buffer.alloc(512);
      const bytesRead = fs.readSync(fileHandle, sample, 0, sample.length, 0);
      for (let index = 0; index < bytesRead; index += 1) {
        if (sample[index] === 0) return true;
      }
      return false;
    } finally {
      if (fileHandle !== null) fs.closeSync(fileHandle);
    }
  };

  const toRelativePath = (absolutePath) => {
    const relative = path.relative(kRootResolved, absolutePath);
    return relative === "" ? "" : relative.split(path.sep).join("/");
  };

  const buildTreeNode = (absolutePath, depthRemaining) => {
    const stats = fs.statSync(absolutePath);
    const nodeName = path.basename(absolutePath);
    const nodePath = toRelativePath(absolutePath);

    if (!stats.isDirectory()) {
      return { type: "file", name: nodeName, path: nodePath };
    }

    if (depthRemaining <= 0) {
      return { type: "folder", name: nodeName, path: nodePath, children: [] };
    }

    const children = fs
      .readdirSync(absolutePath, { withFileTypes: true })
      .filter((entry) => {
        if (entry.isDirectory() && kIgnoredDirectoryNames.has(entry.name)) {
          return false;
        }
        return entry.isDirectory() || entry.isFile();
      })
      .map((entry) => buildTreeNode(path.join(absolutePath, entry.name), depthRemaining - 1))
      .sort((leftNode, rightNode) => {
        if (leftNode.type !== rightNode.type) {
          return leftNode.type === "folder" ? -1 : 1;
        }
        return leftNode.name.localeCompare(rightNode.name);
      });

    return { type: "folder", name: nodeName, path: nodePath, children };
  };

  const runGitSync = (message, relativeFilePath) =>
    new Promise((resolve) => {
      const syncArgs = ["git-sync", "-m", message];
      if (relativeFilePath) {
        syncArgs.push("--file", String(relativeFilePath));
      }
      execFile(
        "alphaclaw",
        syncArgs,
        { timeout: 20000, cwd: kRootResolved },
        (error) => {
          if (error) {
            return resolve({
              ok: false,
              error: error.message || "alphaclaw git-sync failed",
            });
          }
          return resolve({ ok: true });
        },
      );
    });

  const runGitCommand = (args) =>
    new Promise((resolve) => {
      execFile(
        "git",
        args,
        { timeout: 10000, cwd: kRootResolved },
        (error, stdout, stderr) => {
          if (error) {
            return resolve({
              ok: false,
              error: String(stderr || stdout || error.message || "git command failed").trim(),
            });
          }
          return resolve({ ok: true, stdout: String(stdout || "") });
        },
      );
    });

  const parseGithubRepoSlug = (value) => {
    const raw = String(value || "").trim();
    if (!raw) return "";
    return raw
      .replace(/^git@github\.com:/i, "")
      .replace(/^https:\/\/github\.com\//i, "")
      .replace(/\.git$/i, "")
      .trim();
  };

  app.get("/api/browse/tree", (req, res) => {
    const depthValue = Number.parseInt(String(req.query.depth || ""), 10);
    const depth = Number.isFinite(depthValue) && depthValue > 0 ? depthValue : kDefaultTreeDepth;
    try {
      const tree = buildTreeNode(kRootResolved, depth);
      return res.json({ ok: true, root: tree });
    } catch (error) {
      return res
        .status(500)
        .json({ ok: false, error: error.message || "Could not build file tree" });
    }
  });

  app.get("/api/browse/read", (req, res) => {
    const resolvedPath = resolveSafePath(req.query.path);
    if (!resolvedPath.ok) {
      return res.status(400).json({ ok: false, error: resolvedPath.error });
    }

    try {
      const stats = fs.statSync(resolvedPath.absolutePath);
      if (!stats.isFile()) {
        return res.status(400).json({ ok: false, error: "Path is not a file" });
      }
      if (isLikelyBinaryFile(resolvedPath.absolutePath)) {
        return res.status(400).json({ ok: false, error: "Binary files are not editable" });
      }
      const content = fs.readFileSync(resolvedPath.absolutePath, "utf8");
      return res.json({
        ok: true,
        path: resolvedPath.relativePath,
        content,
      });
    } catch (error) {
      return res.status(500).json({ ok: false, error: error.message || "Could not read file" });
    }
  });

  app.get("/api/browse/git-summary", async (req, res) => {
    try {
      const envRepoSlug = parseGithubRepoSlug(process.env.GITHUB_WORKSPACE_REPO || "");
      const statusResult = await runGitCommand(["status", "--porcelain", "--branch"]);
      if (!statusResult.ok) {
        if (/not a git repository/i.test(statusResult.error || "")) {
          return res.json({
            ok: true,
            isRepo: false,
            repoPath: kRootResolved,
          });
        }
        return res.status(500).json({
          ok: false,
          error: statusResult.error || "Could not read git status",
        });
      }

      const statusLines = statusResult.stdout
        .split("\n")
        .map((line) => line.trimEnd())
        .filter(Boolean);
      const branchLine = statusLines.find((line) => line.startsWith("##")) || "";
      const branch = branchLine.replace(/^##\s*/, "").split("...")[0] || "unknown";
      const changedFiles = statusLines
        .filter((line) => !line.startsWith("##"))
        .map((line) => ({
          status: line.slice(0, 2).trim() || "M",
          path: line.slice(3).trim(),
        }));

      let repoSlug = envRepoSlug;
      if (!repoSlug) {
        const remoteResult = await runGitCommand(["remote", "get-url", "origin"]);
        if (remoteResult.ok) {
          repoSlug = parseGithubRepoSlug(remoteResult.stdout || "");
        }
      }
      const repoUrl = repoSlug ? `https://github.com/${repoSlug}` : "";

      const logResult = await runGitCommand([
        "log",
        "--pretty=format:%H%x09%h%x09%s%x09%ct",
        "-n",
        "5",
      ]);
      const commits = logResult.ok
        ? logResult.stdout
            .split("\n")
            .map((line) => line.trim())
            .filter(Boolean)
            .map((line) => {
              const [hash = "", shortHash = "", message = "", unixTs = "0"] = line.split("\t");
              return {
                hash,
                shortHash,
                message,
                timestamp: Number.parseInt(unixTs, 10) || 0,
                url: repoSlug && hash ? `${repoUrl}/commit/${hash}` : "",
              };
            })
        : [];

      return res.json({
        ok: true,
        isRepo: true,
        repoPath: kRootResolved,
        repoSlug,
        repoUrl,
        branch,
        isDirty: changedFiles.length > 0,
        changedFilesCount: changedFiles.length,
        changedFiles: changedFiles.slice(0, 8),
        commits,
      });
    } catch (error) {
      return res.status(500).json({
        ok: false,
        error: error.message || "Could not build git summary",
      });
    }
  });

  app.put("/api/browse/write", async (req, res) => {
    const { path: targetPath, content } = req.body || {};
    const resolvedPath = resolveSafePath(targetPath);
    if (!resolvedPath.ok) {
      return res.status(400).json({ ok: false, error: resolvedPath.error });
    }
    if (typeof content !== "string") {
      return res.status(400).json({ ok: false, error: "content must be a string" });
    }

    try {
      const stats = fs.statSync(resolvedPath.absolutePath);
      if (!stats.isFile()) {
        return res.status(400).json({ ok: false, error: "Path is not a file" });
      }
      fs.writeFileSync(resolvedPath.absolutePath, content, "utf8");
      const fileName = path.basename(resolvedPath.absolutePath);
      const syncResult = await runGitSync(
        `Edit ${fileName} via UI`,
        resolvedPath.relativePath,
      );
      return res.json({
        ok: true,
        path: resolvedPath.relativePath,
        synced: syncResult.ok,
        syncError: syncResult.ok ? undefined : syncResult.error,
      });
    } catch (error) {
      return res.status(500).json({ ok: false, error: error.message || "Could not save file" });
    }
  });
};

module.exports = { registerBrowseRoutes };
