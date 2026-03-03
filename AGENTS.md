### AlphaClaw Project Context

AlphaClaw is the ops and setup layer around OpenClaw. It provides a browser-based setup UI, gateway lifecycle management, watchdog recovery flows, and integrations (for example Telegram, Discord, Google Workspace, and webhooks) so users can operate OpenClaw without manual server intervention.

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

### Coding And Change Patterns

- Keep edits targeted and production-safe; favor small, reviewable changes.
- Preserve existing behavior unless the task explicitly requires behavior changes.
- Follow existing UI conventions and shared components for consistency.
- Reuse existing server route and state patterns before introducing new abstractions.
- Update tests when behavior changes in routes, watchdog flows, or setup state.

### Where To Put Agent Guidance

- **This file (`AGENTS.md`):** Project-level guidance for coding agents working on the AlphaClaw codebase — architecture, conventions, release flow, UI patterns, etc.
- **`lib/setup/core-prompts/AGENTS.md`:** Runtime prompt injected into the OpenClaw agent's system prompt. Only write there when the guidance is meant for the deployed agent's behavior, not for coding on this project.

### Release Flow (Beta -> Production)

Use this release flow when promoting tested beta builds to production:

1. Ensure `main` is clean and synced, and tests pass.
2. Publish beta iterations as needed:
   - `npm version prerelease --preid=beta`
   - `git push && git push --tags`
   - `npm publish --tag beta`
3. For beta template testing, pin exact beta in template `package.json` (for example `0.3.2-beta.4`) to avoid Docker layer cache reusing old installs.
4. When ready for production, publish a stable release version (for example `0.3.2`):
   - `npm version 0.3.2`
   - `git push && git push --tags`
   - `npm publish` (publishes to `latest`)
5. Return templates to production channel:
   - `@chrysb/alphaclaw: "latest"`
6. Optionally keep beta branch/tag flows active for next release cycle.

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

### UI Conventions

Use these conventions for all UI work under `lib/public/js` and `lib/public/css`.

#### Component structure

- Use arrow-function components and helpers.
- Prefer shared components over one-off markup when a pattern already exists.
- Keep constants in `kName` format (e.g. `kUiTabs`, `kGroupOrder`, `kNamePattern`).
- Keep component-level helpers near the top of the file, before the main export.

#### Rendering and composition

- Use the `htm` + `preact` pattern:
  - `const html = htm.bind(h);`
  - return `html\`...\``
- Prefer early return for hidden states (e.g. `if (!visible) return null;`).
- Use `<PageHeader />` for tab/page headers that need a title and right-side actions.
- Use card shells consistently: `bg-surface border border-border rounded-xl`.

#### Buttons

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
- In multi-step auth flows, keep the active "finish" action visually primary and demote the "start/restart" action to secondary once the flow has started.

#### Dialogs and modals

- Use `<ConfirmDialog />` for destructive/confirmation flows.
- Use `<ModalShell />` for non-confirm custom modals that need shared overlay and Escape handling.
- Modal overlay convention:
  - `fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50`
- Modal panel convention:
  - `bg-modal border border-border rounded-xl p-5 ...`
- Support close-on-overlay click and Escape key for dialogs.

#### Inputs and forms

- Reuse `<SecretInput />` for sensitive values and token/key inputs.
- Base input look should remain consistent:
  - `bg-black/30 border border-border rounded-lg ... focus:border-gray-500`
- Preserve monospace for technical values (`font-mono`) and codes/paths.
- Prefer inline helper text under fields (`text-xs text-gray-500/600`) for setup guidance.

#### Feedback and state

- Use `showToast(...)` for user-visible operation outcomes.
- Prefer semantic toast levels (`success`, `error`, `warning`, `info`) at callsites. Legacy color aliases are only for backwards compatibility.
- Keep toast positioning relative to the active page container (not the viewport) when layout banners can shift content.
- Keep loading/saving flags explicit in state (`saving`, `creating`, `restartingGateway`, etc.).
- Reuse `<LoadingSpinner />` for loading indicators instead of inline spinner SVG markup.
- Use `<Badge />` for compact status chips (e.g. connected/not connected) instead of one-off status span styling.
- Use polling via `usePolling` for frequently refreshed backend-backed data.
- For restart-required flows, render the standardized yellow restart banner style used in `providers`, `envars`, and `webhooks`.

For inconsistencies tracking and DRY opportunities, see `lib/setup/core-prompts/UI-DRY-OPPORTUNITIES.md`.
