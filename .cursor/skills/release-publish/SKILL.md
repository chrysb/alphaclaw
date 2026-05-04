---
name: release-publish
description: >-
  Publish a new AlphaClaw release to npm and GitHub. Use when the user asks to
  cut a release, publish a version, write release notes, draft a release tweet,
  or close issues addressed in a release. Covers git history analysis, release
  note drafting, npm publishing, GitHub release creation, issue closing, and
  tweet drafting.
---

# Release Publish

End-to-end workflow for publishing an AlphaClaw release. Produces release notes
in the [OpenClaw release format](https://github.com/openclaw/openclaw/releases),
publishes to npm, creates a GitHub release, closes addressed issues, and drafts
a tweet.

## Workflow

### Phase 1: Gather History

1. Identify the previous stable tag (`git tag --sort=-v:refname`).
2. Determine the target version. If on a beta prerelease, the stable version is
   the base (e.g. `0.6.0-beta.3` → `0.6.0`). Confirm with the user if unclear.
3. Collect all commits since the last stable tag:
   ```
   git log v<prev>..HEAD --oneline --no-merges
   git log v<prev>..HEAD --no-merges --format="----%nCommit: %h%nSubject: %s%n%b"
   ```
4. Identify external contributors:
   ```
   git log v<prev>..HEAD --all --format="%an" | sort | uniq -c | sort -rn
   ```
5. Find merged PRs and contributor credits:
   ```
   git log v<prev>..HEAD --all --merges --format="%s"
   ```
6. Check open issues on the repo that may be addressed:
   ```
   gh issue list --repo chrysb/alphaclaw --state open
   ```
   Cross-reference issue descriptions against the commit log to identify fixes.

### Phase 2: Draft Release Notes

Present a draft to the user **before** publishing. Use this structure:

```markdown
## AlphaClaw <version>

### What's New
* **Feature name**: concise description of what it does and why it matters.

### Fixes
* **Short label**: what was broken and how it's fixed. Reference issues
  (`Fixes #N`) and PRs (`(#N)`) inline. Credit external contributors
  (`Thanks @handle.`).

### Internal
* Refactoring, test coverage, and code health improvements that don't change
  user-facing behavior.

### Contributors
* @handle
```

#### Style rules

- Each bullet starts with a **bold short label** followed by a colon.
- Describe the *what and why*, not the implementation details.
- Keep **What's New** and **Fixes** user-facing: describe behavior, not code
  structure (no "decomposed into folder-based components", "co-located hooks",
  etc.). Save implementation details for the **Internal** section.
- Use active voice ("add", "fix", "remove"), not past tense.
- Reference GitHub issues with `Fixes #N` (auto-closes) or `#N` (link only).
- Reference PRs with `(#N)`.
- Credit external contributors with `Thanks @handle.` at the end of the bullet.
- List all credited contributors in a **Contributors** section at the bottom.
- Keep the Internal section concise; one bullet per theme, not per commit.
- Fold reverted commits into their replacement — don't list revert + re-land.

#### Deciding what goes where

| Commit type | Section |
|---|---|
| New user-facing capability | What's New |
| Bug fix, regression fix | Fixes |
| Dependency bump (OpenClaw, etc.) | What's New (last bullet) |
| Refactor, test backfill, code split | Internal |
| Version bump commits (`0.6.0-beta.N`) | Skip |
| Merge commits | Skip |

### Phase 3: Review

Present the full draft to the user and wait for approval or edits before
proceeding. Do not publish without explicit confirmation.

### Phase 4: Publish

Once approved, execute in order:

1. **Ensure clean state**: `git status` should show no uncommitted changes.
   Switch to `main` if not already there.
2. **Run tests**: `npm test` — abort if any fail.
3. **Verify the OpenClaw dependency**: if AlphaClaw depends on a pinned
   `openclaw` version, confirm `package-lock.json` and the local install resolve
   to the same version before publishing.
   ```
   node -p "require('./package.json').dependencies.openclaw"
   node -p "require('./package-lock.json').packages['node_modules/openclaw'].version"
   node -p "require('./node_modules/openclaw/package.json').version"
   ```
   When the release relies on a specific upstream OpenClaw fix, verify it in the
   installed package rather than carrying local OpenClaw edits. For example:
   ```
   grep -R -n "allowConversationAccess" node_modules/openclaw/dist/zod-schema-* node_modules/openclaw/dist/runtime-schema-*
   ```
4. **Bump version**: `npm version <version>` (creates commit + tag).
5. **Push**: `git push && git push --tags`.
6. **Publish to npm**: `npm publish` (publishes to `latest` tag).
7. **Create GitHub release**:
   ```
   gh release create v<version> --title "AlphaClaw <version>" --notes "<body>"
   ```
   Use a HEREDOC for the body to preserve formatting.

### Phase 4.5: Sync Deployment Templates (mandatory for stable releases)

After every **stable** `npm publish` to `latest`, update **all three** deployment
templates so Railway, Render, and Apex stay pinned to the same AlphaClaw and
OpenClaw versions (deterministic Docker installs, no drift from `@chrysb/alphaclaw`
`latest`).

Repos:

- `~/Projects/openclaw-railway-template` (typically `main` for production; `beta`
  only when cutting a beta — see release-beta skill; merge `main` into `beta`
  after stable pins when you want `beta` to match production pins)
- `~/Projects/openclaw-render-template` (typically `main`)
- `~/Projects/openclaw-apex-template` (typically `main`)

For **each** repo:

1. Switch to the intended branch (confirm with the user if unclear).
2. Set `@chrysb/alphaclaw` in `package.json` to the released version. Do not add
   `overrides` for `openclaw` in templates unless you are doing one-off debugging —
   OpenClaw should resolve transitively from AlphaClaw’s declared dependency (same
   resulting version across templates unless you intentionally diverge).
3. Run `npm install` to refresh or create `package-lock.json`.
4. Verify the template install resolved the expected OpenClaw version and includes
   any upstream OpenClaw fixes AlphaClaw depends on:
   ```
   node -p "require('./node_modules/@chrysb/alphaclaw/package.json').dependencies.openclaw"
   node -p "require('./node_modules/openclaw/package.json').version"
   grep -R -n "allowConversationAccess" node_modules/openclaw/dist/zod-schema-* node_modules/openclaw/dist/runtime-schema-*
   ```
   If this fails, stop: the template resolved the wrong OpenClaw package or is
   missing an upstream fix required by AlphaClaw.
5. Commit and push (include both `package.json` and `package-lock.json` when the
   lockfile exists or was added).

Do not skip Render or Apex: pinning only one template while others stay on
`latest` causes drift and non-reproducible installs between platforms.

### Phase 5: Close Issues

For each issue referenced with `Fixes #N` in the release notes:

```
gh issue close <N> --repo chrysb/alphaclaw --comment "Fixed in v<version>."
```

If an issue is partially addressed or only improved (not fully resolved), leave
it open and add a comment instead:

```
gh issue comment <N> --repo chrysb/alphaclaw --body "Improved in v<version> — <brief description>. Leaving open for remaining work."
```

### Phase 6: Draft Tweet

Draft a tweet following the OpenClaw announcement style:

```
AlphaClaw <version> 🐺

<emoji> <headline feature or fix — one line>
<emoji> <second highlight>
<emoji> <third highlight>
<emoji> <fourth highlight (optional)>

<witty one-liner or tagline>
```

#### Tweet style rules

- Keep under 280 characters.
- Use one emoji per line to set the tone (feature type, not decoration).
- Headline the biggest user-facing change first.
- End with a short memorable line — personality over formality.
- Do not include a link; the user will attach the GitHub release card.
- Offer 2–3 alternative closing lines for the user to choose from.

## Emergency / Hotfix Releases

For hotfix versions (e.g. `0.6.1`) that fix a critical bug:

1. Follow the same workflow but scope the history to the previous released tag.
2. The release notes can be shorter — a single Fixes section is fine.
3. Skip the tweet unless the fix is noteworthy.

## Pre-release / Beta Publishes

For beta iterations during development:

```
npm version prerelease --preid=beta
git push && git push --tags
npm publish --tag beta
```

Beta publishes do not need GitHub releases, issue closing, or tweets. They are
used for testing via the `openclaw-railway-template` beta branch.

After each beta publish, remind the user to update the Railway template's
`package.json` on the `beta` branch to pin the exact beta version. If you also
ship betas through Render or Apex, pin those templates the same way on the
branch they use for prereleases.
