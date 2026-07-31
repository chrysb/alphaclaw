---
name: release-beta
description: >-
  Publish the next AlphaClaw beta and always update the Railway beta template
  pin to the exact released beta version.
---

# Release Beta

Use this workflow whenever the user asks to "publish beta", "push beta channel",
"cut another beta", or equivalent.

## Goal

Ship a new `@chrysb/alphaclaw` beta and keep
`~/Projects/openclaw-railway-template` `beta` branch pinned to that exact beta
version.

## Required sequence

1. **Prepare commit state in AlphaClaw**
   - Check `git status --short` in `~/Projects/alphaclaw`.
   - If there are changes to include, stage and commit them first.
   - Never commit unrelated secret files.

2. **Run tests before release**
   - Run `npm test` in `~/Projects/alphaclaw`.
   - Abort beta publish if tests fail.

3. **Cut and publish beta**
   - `npm version prerelease --preid=beta`
   - `git push && git push --tags`
   - `npm publish --tag beta`

4. **Always update Railway beta template pin (mandatory)**
   - Open `~/Projects/openclaw-railway-template/package.json`.
   - Ensure branch is `beta`.
   - Set `"@chrysb/alphaclaw"` to the exact new beta version (for example
     `"0.7.2-beta.1"`).
   - If you updated dependency pins (for example `openclaw`), run
     `npm install` in the template repo so `package-lock.json` is refreshed
     before committing.
   - Commit and push that repo:
     - commit message format: `Pin AlphaClaw beta to <version>.`
     - push to `origin/beta`.

5. **Report completion**
   - Include:
     - release commit hash in AlphaClaw
     - beta tag/version published
     - Railway template commit hash for the pin update
   - Mention any warnings (for example npm `package.json` normalization warning).

## Safety notes

- Do not skip tests unless user explicitly asks.
- Do not use `--no-verify`.
- Do not force push.
- Do not create GitHub release notes for beta-only publishes unless requested.
- Prefer deterministic installs in templates: keep `package-lock.json` committed
  and use `npm ci` in Dockerfiles.
