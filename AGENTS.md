## Project Overview

### AlphaClaw Project Context

AlphaClaw is the ops and setup layer around OpenClaw. It provides a browser-based setup UI, gateway lifecycle management, watchdog recovery flows, and integrations (for example Telegram, Discord, Google Workspace, and webhooks) so users can operate OpenClaw without manual server intervention.

### Understanding OpenClaw

If you need to understand the internals of OpenClaw, you can inspect the code at `~/Projects/openclaw/src`

### Architecture At A Glance

- `bin/alphaclaw.js`: CLI entrypoint and lifecycle command surface.
- `lib/server`: Express server, authenticated setup APIs, watchdog APIs, channel integrations, and proxying to the OpenClaw gateway.
- `lib/public`: Setup UI frontend (component-driven tabs and flows for providers, envars, watchdog, webhooks, and onboarding).
- `lib/setup`: Prompt hardening templates and setup-related assets injected into agent/system behavior.

Runtime model:

1. AlphaClaw server starts and manages OpenClaw as a child process.
2. Setup UI calls AlphaClaw APIs for configuration and operations.
3. AlphaClaw proxies gateway traffic and handles watchdog monitoring/repair.

### Key Technologies

- Node.js 22+ runtime.
- Express-based HTTP API server.
- `http-proxy` for gateway proxy behavior.
- OpenClaw CLI/gateway process orchestration.
- Preact + `htm` frontend patterns for Setup UI components.
- Vitest + Supertest for server and route testing.

## Coding Conventions

### Change Patterns

- Keep edits targeted and production-safe; favor small, reviewable changes.
- Preserve existing behavior unless the task explicitly requires behavior changes.
- Follow existing UI conventions and shared components for consistency.
- Reuse existing server route and state patterns before introducing new abstractions.
- Update tests when behavior changes in routes, watchdog flows, or setup state.
- Before running tests in a fresh checkout, run `npm install` so `vitest` (devDependency) is available for `npm test`.

### Code Structure

- Avoid monolithic implementation files for new features. For new UI areas and new API areas, start with a decomposed structure (focused components/hooks/utilities for UI; focused route modules/services/helpers for server) rather than building one large file first and splitting later.
- When adding a new feature area, follow the existing project patterns from day one (for example feature folders with `index.js` plus `use-*` hooks in UI, and route + service separation on server) so code stays maintainable as the feature grows.
- When continuing to build on a file that is growing large or accumulating unrelated concerns, stop and decompose it before adding more code rather than letting it drift into a monolith.

### OpenClaw Config Access

- When reading `openclaw.json` in server code, use the shared helper in `lib/server/openclaw-config.js` (`readOpenclawConfig`) instead of ad-hoc `JSON.parse(fs.readFileSync(...))` blocks.

### Where To Put Agent Guidance

- **This file (`AGENTS.md`):** Project-level guidance for coding agents working on the AlphaClaw codebase — architecture, conventions, release flow, UI patterns, etc.
- **`lib/setup/core-prompts/AGENTS.md`:** Runtime prompt injected into the OpenClaw agent's system prompt. Only write there when the guidance is meant for the deployed agent's behavior, not for coding on this project.

## Operations

### Release Flow (Beta -> Production)

Use this release flow when promoting tested beta builds to production:

1. Ensure `main` is clean and synced, and tests pass.
2. Publish beta iterations as needed:
   - `npm version prerelease --preid=beta`
   - `git push && git push --tags`
   - `npm publish --tag beta`
3. Immediately after each beta publish, update `~/Projects/openclaw-railway-template` on the `beta` branch to pin the exact beta version in `package.json` (for example `0.3.2-beta.4`), then commit and push that template change. Do not leave the beta template on `latest`, or Docker layer cache can reuse an older install.
4. When ready for production, publish a stable release version (for example `0.3.2`):
   - `npm version 0.3.2`
   - `git push && git push --tags`
   - `npm publish` (publishes to `latest`)
5. Return templates to production channel:
   - `@chrysb/alphaclaw: "latest"`
6. Optionally keep beta branch/tag flows active for next release cycle.

### Runtime Dependency Guardrails (Express 4 vs 5)

AlphaClaw currently expects Express 4 semantics in its setup API layer. A broken container dependency tree can accidentally resolve `express@5` at `/app/node_modules/express`, which causes subtle request handling regressions (for example body parsing behavior on certain methods).

Known root cause pattern:

- Mutating `/app/node_modules` in-place (for example copy-over installs used for emergency package swaps) can leave the runtime tree inconsistent with `/app/package.json`.
- This can hoist `express@5` to the app root, so `require("express")` inside AlphaClaw resolves the wrong major version.

Preferred fix/recovery:

1. Ensure template `package.json` pins the intended `@chrysb/alphaclaw` version.
2. Rebuild the `openclaw` container from scratch (no cache) and recreate it:
   - `docker compose down`
   - `docker compose build --no-cache openclaw`
   - `docker compose up -d openclaw`
3. Verify runtime resolution inside the container:
   - `node -p "require('express/package.json').version"` should be `4.x`
   - `npm ls express` should show `@chrysb/alphaclaw` on `express@4.x` (OpenClaw can still carry its own `express@5` subtree).

### Telegram Notice Format (AlphaClaw)

Use this format for any Telegram notices sent from AlphaClaw services (watchdog, system alerts, repair notices):

1. Header line (Markdown): `🐺 *AlphaClaw Watchdog*`
2. Headline line (simple, no `Status:` prefix):
   - `🔴 Crash loop detected`
   - `🔴 Crash loop detected, auto-repairing...`
   - `🟡 Auto-repair started, awaiting health check`
   - `🟢 Auto-repair complete, gateway healthy`
   - `🟢 Gateway healthy again`
   - `🔴 Auto-repair failed`
3. Append a markdown link to the headline when URL is available:
   - `... - [View logs](<full-url>/#/watchdog)`
4. Optional context lines like `Trigger: ...`, `Attempt count: ...`
5. For values with underscores or special characters (for example `crash_loop`), wrap the value in backticks:
   - `Trigger: \`crash_loop\``
6. Do not use HTML tags (`<b>`, `<a href>`) for Telegram watchdog notices.

## UI Conventions

Use these conventions for all UI work under `lib/public/js` and `lib/public/css`.

### Component structure

- Use arrow-function components and helpers.
- Prefer shared components over one-off markup when a pattern already exists.
- Keep constants in `kName` format (e.g. `kUiTabs`, `kGroupOrder`, `kNamePattern`).
- Keep component-level helpers near the top of the file, before the main export.
- Treat `index.js` as a presentational shell whenever possible: keep business logic in hooks and pass derived state/actions down as props.
- Add reusable SVG icons to `lib/public/js/components/icons.js` and import them from there; avoid introducing one-off inline SVGs in feature files when a shared icon component can be used.

### Rendering and composition

- Use the `htm` + `preact` pattern:
  - `const html = htm.bind(h);`
  - return `html\`...\``
- In `htm` templates, be explicit with inline spacing around styled inline tags (`<span>`, `<code>`, `<a>`): use ` ${" "}` where needed, and verify rendered copy so words never collapse (`eventsand`) or gain double spaces.
- Prefer early return for hidden states (e.g. `if (!visible) return null;`).
- Use `<PageHeader />` for tab/page headers that need a title and right-side actions.
- Use card shells consistently: `bg-surface border border-border rounded-xl`.
- For nested "surface on surface" blocks (content inside a `bg-surface` card), use `ac-surface-inset` for the inner container treatment so inset sections match shared history/sessions styling.
- For internal section dividers, use `border-t border-border` (avoid opacity variants) with comfortable vertical spacing around the divider.

### Buttons

- Primary actions: `ac-btn-cyan`
- Secondary actions: `ac-btn-secondary`
- Positive/success actions: `ac-btn-green`
- Ghost/text actions: `ac-btn-ghost` (use for low-emphasis actions like "Disconnect" or "Add provider")
- Destructive inline actions: `ac-btn-danger`
- Use consistent disabled treatment: `opacity-50 cursor-not-allowed`.
- Keep action sizing consistent (`text-xs px-3 py-1.5 rounded-lg` for compact controls unless there is a clear reason otherwise).
- For `<PageHeader />` actions, use `ac-btn-cyan` (primary) or `ac-btn-secondary` (secondary) by default; avoid ghost/text-only styling for main header actions.
- Prefer shared action components when available (`ActionButton`, `UpdateActionButton`, `ConfirmDialog`) before custom button logic.
- In setup/onboarding auth flows (e.g. Codex OAuth), prefer `<ActionButton />` over raw `<button>` for consistency in tone, sizing, and loading behavior.
- In setup wizard/multi-step modal footers, use `<ActionButton />` for Back/Next/Finish/Done actions (not raw `<button>`), so loading and tone behavior stays consistent.
- In multi-step auth flows, keep the active "finish" action visually primary and demote the "start/restart" action to secondary once the flow has started.

### Dialogs and modals

- Use `<ConfirmDialog />` for destructive/confirmation flows.
- Use `<ModalShell />` for non-confirm custom modals that need shared overlay and Escape handling.
- Modal overlay convention:
  - `fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50`
- Modal panel convention:
  - `bg-modal border border-border rounded-xl p-5 ...`
- Support close-on-overlay click and Escape key for dialogs.

### Inputs and forms

- Reuse `<SecretInput />` for sensitive values and token/key inputs.
- Reuse `<ToggleSwitch />` for boolean on/off controls instead of ad-hoc checkbox/switch markup.
- Base input look should remain consistent:
  - `bg-black/30 border border-border rounded-lg ... focus:border-gray-500`
- Preserve monospace for technical values (`font-mono`) and codes/paths.
- Prefer inline helper text under fields (`text-xs text-gray-500/600`) for setup guidance.
- For tip/help links in helper text, use the shared `ac-tip-link` class (token-backed via `--accent-link`) instead of per-file ad-hoc cyan classes.

### Feedback and state

- Use `showToast(...)` for user-visible operation outcomes.
- Prefer semantic toast levels (`success`, `error`, `warning`, `info`) at callsites. Legacy color aliases are only for backwards compatibility.
- Keep toast positioning relative to the active page container (not the viewport) when layout banners can shift content.
- For hover help and icon labels, use the shared portal-backed tooltip components (`Tooltip`, `InfoTooltip`) instead of inline absolutely positioned popovers, so tooltips are not clipped by cards, rows, or scroll containers.
- Keep loading/saving flags explicit in state (`saving`, `creating`, `restartingGateway`, etc.).
- Reuse `<LoadingSpinner />` for loading indicators instead of inline spinner SVG markup.
- Use `<Badge />` for compact status chips (e.g. connected/not connected) instead of one-off status span styling.
- Use polling via `usePolling` for frequently refreshed backend-backed data.
- For restart-required flows, render the standardized yellow restart banner style used in `providers`, `envars`, and `webhooks`.

### Shared formatting utilities

- Prefer shared formatter helpers in `lib/public/js/lib/format.js` for reusable value formatting (`formatX` style helpers such as date/time, currency, integers, and common duration formats).
- Before adding a new formatter in a component, check `lib/public/js/lib/format.js` and reuse an existing helper when possible.
- Add new formatter helpers to `lib/public/js/lib/format.js` when the behavior is cross-feature and likely to be reused; keep feature-specific transforms local to the feature folder.
- Avoid wrapper pass-through helpers that only rename a global formatter without adding feature-specific behavior.

### localStorage keys

- All standalone `localStorage` keys are defined in `lib/public/js/lib/storage-keys.js`. Import keys from this file — never define raw localStorage key strings inline in components.
- Use the naming convention `alphaclaw.<area>.<purpose>` for new keys (e.g. `alphaclaw.doctor.lastSessionKey`).
- Keys that live inside the `alphaclaw.ui.settings` JSON blob (e.g. `browseLastPath`, `doctorWarningDismissedUntilMs`) are sub-keys, not standalone localStorage entries — those stay in their consuming file.

For inconsistencies tracking and DRY opportunities, see `lib/setup/core-prompts/UI-DRY-OPPORTUNITIES.md`.
