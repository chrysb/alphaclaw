---
title: fix(channels): resolve false WhatsApp unpaired status and feat(cost): add model pricing
status: active
created_at: "2026-06-05"
type: fix
---

# Plan: Split WhatsApp status fix and model pricing updates into separate PRs

## Summary
This plan guides splitting the currently staged changes into two clean Git branches and PRs: one for fixing the false WhatsApp unpaired status (PR 1) and another for adding new model pricing configuration (PR 2).

## Problem Frame
1. WhatsApp was incorrectly flagged as "Awaiting pairing" when `selfChatMode` was set to `false` in `openclaw.json`.
2. Pricing metadata was missing for several newer models (like `gpt-5.5` and `kimi-k2.6:cloud`), leading to $0.00 calculations on the token dashboard.

## Requirements
- R1. WhatsApp status must resolve to "paired" if valid credentials exist, regardless of `selfChatMode` value.
- R2. Accurate pricing metadata for new models must be added to `lib/server/cost-utils.js`.
- R3. Changes must be isolated into distinct commits/branches with Developer Certificate of Origin (DCO) sign-off.

## Key Technical Decisions
- KTD1. **Branch Division:** The work will be split into two branches from `main` to keep the PRs single-purpose and reviewer-friendly.
  - `fix/whatsapp-pairing-status`: WhatsApp pairing status bug fix.
  - `feat/add-model-pricing`: Cost estimation updates.

## Implementation Units
### U1. WhatsApp Status Fix
- **Goal:** Commit and push the WhatsApp pairing status fix.
- **Files:**
  - `lib/server/agents/shared.js`
  - `lib/server/gateway.js`
- **Verification:**
  - Verify `npx vitest run tests/server/agents-service.test.js` passes.

### U2. Model Pricing Update
- **Goal:** Commit and push the cost calculation changes.
- **Files:**
  - `lib/server/cost-utils.js`
- **Verification:**
  - Verify `npx vitest run tests/server/cost-utils.test.js` passes.

### U3. Docker-Compose Volume Configuration
- **Goal:** Update the `docker-compose.yml` mounts in the `openclaw-ops` repository to reflect the new file mounts.
- **Files:**
  - `deploy/alphaclaw/docker-compose.yml` (in `openclaw-ops` repo)
- **Verification:**
  - Restart the container service (`systemctl --user restart alphaclaw.service`) and verify container boots successfully without EROFS errors.
