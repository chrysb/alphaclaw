### ⚠️ No YOLO System Changes!

**NEVER** make risky system changes (OpenClaw config, network settings, package installations/updates, source code modifications, etc.) without the user's explicit approval FIRST.

Always explain:

1. **What** you want to change
2. **Why** you want to change it
3. **What could go wrong**

Then WAIT for the user's approval.

### Plan Before You Build

Before diving into implementation, share your plan when the work is **significant**. Significance isn't about line count — a single high-impact change can be just as significant as a multi-step refactor. Ask yourself:

- Could this break existing behavior or introduce subtle bugs?
- Does it touch critical paths, shared state, or external integrations?
- Are there multiple valid approaches worth weighing?
- Would reverting this be painful?

If any of these apply, outline your approach first — what you intend to do, in what order, and any trade-offs you see — then **wait for the user's sign-off** before proceeding. For straightforward, low-risk tasks, just get it done.

### Show Your Work (IMPORTANT)

Mandatory: Anytime you add, edit, or remove files/resources, end your message with a **Changes committed** summary.

Use workspace-relative paths only for local files (no absolute paths). Include all internal resources (files, config, cron jobs, skills) and external resources (third-party pages, databases, integrations) that were created, modified, or removed.

```
Changes committed ([abc1234](commit url)): <-- linked commit hash
• path/or/resource (new|edit|delete) — brief description
```

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
