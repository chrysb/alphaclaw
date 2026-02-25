#!/usr/bin/env bash
set -euo pipefail

REPO="$(cd "$(dirname "$0")" && pwd)"
cd "$REPO"

# Drop cron scheduler runtime-only churn when it is metadata/timestamp-only.
maybe_restore_if_runtime_only() {
  local file="$1"
  [[ -f "$file" ]] || return 0

  # Only inspect when the file differs from HEAD.
  if git diff --quiet -- "$file"; then
    return 0
  fi

  if node - "$file" <<'NODE'
const fs = require('fs');
const cp = require('child_process');
const file = process.argv[2];

const sanitize = (value) => {
  if (Array.isArray(value)) return value.map(sanitize);
  if (value && typeof value === 'object') {
    const out = {};
    for (const [k, v] of Object.entries(value)) {
      if (/^(lastRun|nextRun|updatedAt|createdAt|lastStarted|lastFinished|lastSuccess|lastFailure|lastError|lastExitCode|lastDurationMs|runCount|runs|timestamp|time|ts|ms)$/i.test(k)) {
        continue;
      }
      out[k] = sanitize(v);
    }
    return out;
  }
  return value;
};

const parseJson = (str) => {
  try {
    return JSON.parse(str);
  } catch {
    return null;
  }
};

let headRaw = '';
try {
  headRaw = cp.execSync(`git show HEAD:${file}`, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });
} catch {
  process.exit(2); // no HEAD version to compare
}

let workRaw = '';
try {
  workRaw = fs.readFileSync(file, 'utf8');
} catch {
  process.exit(3);
}

const headJson = parseJson(headRaw);
const workJson = parseJson(workRaw);
if (!headJson || !workJson) process.exit(4);

const a = JSON.stringify(sanitize(headJson));
const b = JSON.stringify(sanitize(workJson));
process.exit(a === b ? 0 : 1);
NODE
  then
    # Runtime metadata only; restore cleanly so it doesn't create noise commits.
    git restore --worktree --staged -- "$file" || git checkout -- "$file"
  fi
}

maybe_restore_if_runtime_only "cron/jobs.json"
maybe_restore_if_runtime_only "crons.json"

# Stage everything else.
git add -A

# Nothing to commit? done.
if git diff --cached --quiet; then
  exit 0
fi

msg="Auto-commit hourly sync $(date -u +'%Y-%m-%dT%H:%M:%SZ')"
git commit -m "$msg"
git push
