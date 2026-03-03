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
