const path = require("path");
const { execFile } = require("child_process");

const kDefaultTreeDepth = 10;
const kIgnoredDirectoryNames = new Set([
  ".git",
  ".alphaclaw",
  "node_modules",
  ".cache",
  "dist",
  "build",
]);
const kLockedBrowsePaths = new Set([
  "hooks/bootstrap/agents.md",
  "hooks/bootstrap/tools.md",
  ".alphaclaw/hourly-git-sync.sh",
  ".alphaclaw/.cli-device-auto-approved",
]);
const kImageMimeTypeByExtension = new Map([
  [".png", "image/png"],
  [".jpg", "image/jpeg"],
  [".jpeg", "image/jpeg"],
  [".gif", "image/gif"],
  [".webp", "image/webp"],
  [".svg", "image/svg+xml"],
  [".bmp", "image/bmp"],
  [".ico", "image/x-icon"],
  [".avif", "image/avif"],
]);
const kAudioMimeTypeByExtension = new Map([
  [".mp3", "audio/mpeg"],
  [".wav", "audio/wav"],
  [".ogg", "audio/ogg"],
  [".oga", "audio/ogg"],
  [".m4a", "audio/mp4"],
  [".aac", "audio/aac"],
  [".flac", "audio/flac"],
  [".opus", "audio/opus"],
  [".weba", "audio/webm"],
]);

const matchesPolicyPath = (policyPathSet, normalizedPath) => {
  const safeNormalizedPath = String(normalizedPath || "").trim();
  if (!safeNormalizedPath) return false;
  for (const policyPath of policyPathSet) {
    if (
      safeNormalizedPath === policyPath ||
      safeNormalizedPath.endsWith(`/${policyPath}`)
    ) {
      return true;
    }
  }
  return false;
};

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

  const normalizePolicyPath = (inputPath) =>
    String(inputPath || "")
      .replace(/\\/g, "/")
      .replace(/^\.\/+/, "")
      .replace(/^\/+/, "")
      .trim()
      .toLowerCase();

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

  const getImageMimeType = (targetPath) => {
    const extension = String(path.extname(targetPath || "") || "").toLowerCase();
    return kImageMimeTypeByExtension.get(extension) || "";
  };

  const getAudioMimeType = (targetPath) => {
    const extension = String(path.extname(targetPath || "") || "").toLowerCase();
    return kAudioMimeTypeByExtension.get(extension) || "";
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

  const runGitCommandWithExitCode = (args) =>
    new Promise((resolve) => {
      execFile(
        "git",
        args,
        { timeout: 10000, cwd: kRootResolved },
        (error, stdout, stderr) => {
          const safeStdout = String(stdout || "");
          const safeStderr = String(stderr || "");
          if (!error) {
            return resolve({
              ok: true,
              stdout: safeStdout,
              stderr: safeStderr,
              exitCode: 0,
            });
          }
          return resolve({
            ok: false,
            stdout: safeStdout,
            stderr: safeStderr,
            exitCode: Number.isInteger(error.code) ? error.code : 1,
            error: String(error.message || "git command failed"),
          });
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

  const normalizeChangedPath = (rawPath) => {
    const value = String(rawPath || "").trim();
    if (!value) return "";
    if (value.includes(" -> ")) {
      const segments = value.split(" -> ");
      return String(segments[segments.length - 1] || "").trim();
    }
    return value;
  };

  const parseBranchTracking = (branchLine) => {
    const safeBranchLine = String(branchLine || "").trim();
    const withoutPrefix = safeBranchLine.replace(/^##\s*/, "");
    const [localBranchRaw = "", trackingRaw = ""] = withoutPrefix.split("...");
    const localBranch = localBranchRaw || "unknown";
    const trackingSegment = String(trackingRaw || "").trim();
    const upstreamBranch = trackingSegment.split(" [")[0]?.trim() || "";
    const hasUpstream = upstreamBranch.length > 0;
    const countsMatch = trackingSegment.match(/\[([^\]]+)\]/);
    const countsRaw = countsMatch?.[1] || "";
    const countParts = countsRaw
      .split(",")
      .map((part) => String(part || "").trim())
      .filter(Boolean);
    let aheadCount = 0;
    let behindCount = 0;
    let upstreamGone = false;
    countParts.forEach((part) => {
      const aheadMatch = part.match(/^ahead\s+(\d+)$/i);
      if (aheadMatch?.[1]) {
        aheadCount = Number.parseInt(aheadMatch[1], 10) || 0;
        return;
      }
      const behindMatch = part.match(/^behind\s+(\d+)$/i);
      if (behindMatch?.[1]) {
        behindCount = Number.parseInt(behindMatch[1], 10) || 0;
        return;
      }
      if (part.toLowerCase() === "gone") {
        upstreamGone = true;
      }
    });
    const syncState = !hasUpstream
      ? "no-upstream"
      : upstreamGone
        ? "upstream-gone"
        : aheadCount > 0 && behindCount > 0
          ? "diverged"
          : aheadCount > 0
            ? "ahead"
            : behindCount > 0
              ? "behind"
              : "up-to-date";
    return {
      branch: localBranch,
      upstreamBranch,
      hasUpstream,
      upstreamGone,
      aheadCount,
      behindCount,
      syncState,
    };
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
      const audioMimeType = getAudioMimeType(resolvedPath.absolutePath);
      if (audioMimeType) {
        const audioBytes = fs.readFileSync(resolvedPath.absolutePath);
        const audioDataUrl = `data:${audioMimeType};base64,${audioBytes.toString("base64")}`;
        return res.json({
          ok: true,
          path: resolvedPath.relativePath,
          kind: "audio",
          mimeType: audioMimeType,
          audioDataUrl,
          content: "",
        });
      }
      if (isLikelyBinaryFile(resolvedPath.absolutePath)) {
        const imageMimeType = getImageMimeType(resolvedPath.absolutePath);
        if (!imageMimeType) {
          return res
            .status(400)
            .json({ ok: false, error: "Binary files are not editable" });
        }
        const imageBytes = fs.readFileSync(resolvedPath.absolutePath);
        const imageDataUrl = `data:${imageMimeType};base64,${imageBytes.toString("base64")}`;
        return res.json({
          ok: true,
          path: resolvedPath.relativePath,
          kind: "image",
          mimeType: imageMimeType,
          imageDataUrl,
          content: "",
        });
      }
      const content = fs.readFileSync(resolvedPath.absolutePath, "utf8");
      return res.json({
        ok: true,
        path: resolvedPath.relativePath,
        kind: "text",
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
      const branchTracking = parseBranchTracking(branchLine);
      const branch = branchTracking.branch;
      const diffNumstatResult = await runGitCommand(["diff", "--numstat", "HEAD"]);
      const diffStatsByPath = new Map();
      if (diffNumstatResult.ok) {
        diffNumstatResult.stdout
          .split("\n")
          .map((line) => line.trim())
          .filter(Boolean)
          .forEach((line) => {
            const [addedRaw = "", deletedRaw = "", rawPath = ""] = line.split("\t");
            const normalizedPath = normalizeChangedPath(rawPath);
            if (!normalizedPath) return;
            const addedLines = Number.parseInt(addedRaw, 10);
            const deletedLines = Number.parseInt(deletedRaw, 10);
            diffStatsByPath.set(normalizedPath, {
              addedLines: Number.isFinite(addedLines) ? addedLines : null,
              deletedLines: Number.isFinite(deletedLines) ? deletedLines : null,
            });
          });
      }
      const changedFiles = statusLines
        .filter((line) => !line.startsWith("##"))
        .map((line) => {
          const rawStatus = line.slice(0, 2);
          const pathValue = normalizeChangedPath(line.slice(3));
          const stats = diffStatsByPath.get(pathValue) || {
            addedLines: null,
            deletedLines: null,
          };
          const statusKind =
            rawStatus === "??" || rawStatus.includes("A")
              ? "U"
              : rawStatus.includes("D")
                ? "D"
                : "M";
          return {
            status: rawStatus.trim() || "M",
            statusKind,
            path: pathValue,
            addedLines: stats.addedLines,
            deletedLines: stats.deletedLines,
          };
        });

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
        upstreamBranch: branchTracking.upstreamBranch,
        hasUpstream: branchTracking.hasUpstream,
        upstreamGone: branchTracking.upstreamGone,
        aheadCount: branchTracking.aheadCount,
        behindCount: branchTracking.behindCount,
        syncState: branchTracking.syncState,
        isDirty: changedFiles.length > 0,
        changedFilesCount: changedFiles.length,
        changedFiles: changedFiles.slice(0, 16),
        commits,
      });
    } catch (error) {
      return res.status(500).json({
        ok: false,
        error: error.message || "Could not build git summary",
      });
    }
  });

  app.get("/api/browse/git-diff", async (req, res) => {
    const resolvedPath = resolveSafePath(req.query.path);
    if (!resolvedPath.ok) {
      return res.status(400).json({ ok: false, error: resolvedPath.error });
    }
    const relativePath = String(resolvedPath.relativePath || "").trim();
    if (!relativePath) {
      return res.status(400).json({ ok: false, error: "path is required" });
    }

    try {
      const statusResult = await runGitCommandWithExitCode([
        "status",
        "--porcelain",
        "--",
        relativePath,
      ]);
      if (!statusResult.ok && /not a git repository/i.test(statusResult.stderr || "")) {
        return res.status(400).json({ ok: false, error: "No git repo at this root" });
      }
      const statusLines = statusResult.stdout
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean);
      const isUntracked = statusLines.some((line) => line.startsWith("??"));

      const diffResult = isUntracked
        ? await runGitCommandWithExitCode([
            "diff",
            "--no-index",
            "--",
            "/dev/null",
            resolvedPath.absolutePath,
          ])
        : await runGitCommandWithExitCode(["diff", "HEAD", "--", relativePath]);

      const untrackedAllowedFailure =
        isUntracked && diffResult.exitCode === 1 && diffResult.stdout;
      if (!diffResult.ok && !untrackedAllowedFailure) {
        return res.status(500).json({
          ok: false,
          error: diffResult.stderr || diffResult.error || "Could not load file diff",
        });
      }

      const content = String(diffResult.stdout || "")
        .replaceAll(resolvedPath.absolutePath, relativePath)
        .trimEnd();
      return res.json({
        ok: true,
        path: relativePath,
        content,
      });
    } catch (error) {
      return res
        .status(500)
        .json({ ok: false, error: error.message || "Could not load file diff" });
    }
  });

  app.post("/api/browse/git-sync", async (req, res) => {
    try {
      const commitMessageRaw = String(req.body?.message || "").trim();
      const commitMessage = commitMessageRaw || "sync changes";
      const statusResult = await runGitCommand(["status", "--porcelain", "--branch"]);
      if (!statusResult.ok) {
        if (/not a git repository/i.test(statusResult.error || "")) {
          return res
            .status(400)
            .json({ ok: false, error: "No git repo at this root" });
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
      const branchTracking = parseBranchTracking(branchLine);
      const hasChanges = statusLines
        .filter((line) => !line.startsWith("##"))
        .map((line) => line.trim())
        .filter(Boolean).length > 0;
      let committed = false;
      let pushed = false;
      let shortHash = "";
      if (!hasChanges) {
        const hasAheadCommits = branchTracking.hasUpstream && branchTracking.aheadCount > 0;
        if (!hasAheadCommits) {
          return res.json({
            ok: true,
            committed: false,
            pushed: false,
            message: "No changes to sync",
          });
        }
      }
      if (hasChanges) {
        const addResult = await runGitCommand(["add", "-A"]);
        if (!addResult.ok) {
          return res.status(500).json({
            ok: false,
            error: addResult.error || "Could not stage changes",
          });
        }
        const commitResult = await runGitCommand(["commit", "-m", commitMessage]);
        if (!commitResult.ok) {
          if (/nothing to commit/i.test(commitResult.error || "")) {
            return res.json({
              ok: true,
              committed: false,
              pushed: false,
              message: "No changes to sync",
            });
          }
          return res.status(500).json({
            ok: false,
            error: commitResult.error || "Could not commit changes",
          });
        }
        committed = true;
        const shortHashResult = await runGitCommand(["rev-parse", "--short", "HEAD"]);
        shortHash = shortHashResult.ok ? String(shortHashResult.stdout || "").trim() : "";
      }
      const shouldPush = branchTracking.hasUpstream
        ? branchTracking.aheadCount > 0 || committed
        : committed;
      if (shouldPush) {
        const pushArgs = branchTracking.hasUpstream ? ["push"] : ["push", "-u", "origin", "HEAD"];
        const pushResult = await runGitCommand(pushArgs);
        if (pushResult.ok) {
          pushed = true;
        } else {
          return res.json({
            ok: true,
            committed,
            pushed: false,
            shortHash,
            message: committed
              ? `Committed ${shortHash || "changes"} locally; push failed`
              : "Could not push commits",
            pushError: pushResult.error || "Could not push commits",
          });
        }
      }
      const syncMessage = pushed
        ? committed
          ? `Committed and pushed ${shortHash || "changes"}`
          : "Pushed local commits"
        : committed
          ? `Committed ${shortHash || "changes"}`
          : "No changes to sync";
      return res.json({
        ok: true,
        committed,
        pushed,
        shortHash,
        message: syncMessage,
      });
    } catch (error) {
      return res.status(500).json({
        ok: false,
        error: error.message || "Could not sync changes",
      });
    }
  });

  app.put("/api/browse/write", async (req, res) => {
    const { path: targetPath, content } = req.body || {};
    const resolvedPath = resolveSafePath(targetPath);
    if (!resolvedPath.ok) {
      return res.status(400).json({ ok: false, error: resolvedPath.error });
    }
    const normalizedPolicyPath = normalizePolicyPath(resolvedPath.relativePath);
    if (matchesPolicyPath(kLockedBrowsePaths, normalizedPolicyPath)) {
      return res.status(403).json({
        ok: false,
        error: "This file is managed by Alpha Claw and cannot be edited.",
      });
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
      return res.json({
        ok: true,
        path: resolvedPath.relativePath,
      });
    } catch (error) {
      return res.status(500).json({ ok: false, error: error.message || "Could not save file" });
    }
  });
};

module.exports = { registerBrowseRoutes };
