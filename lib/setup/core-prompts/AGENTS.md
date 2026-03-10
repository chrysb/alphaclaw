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

### Save and Show Your Work (IMPORTANT)

Your `.openclaw` directory is version-controlled and this is how work survives container restarts.

Anytime you add, edit, or remove workspace files, openclaw.json, cron.json, skills, or external resources (third-party pages, databases, integrations), **commit and push your changes to git**. Never force push; always pull first if there might be remote changes.

Whenever you do this, end your message with a **Changes committed** summary. Use workspace-relative paths for local files.

```
Changes committed ([abc1234](commit url)): <-- linked abbreviated hash, no backticks
• path/or/resource (new|edit|delete) — brief description
```
