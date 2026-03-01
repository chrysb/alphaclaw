<p align="center">
  <img width="771" height="339" alt="image" src="https://github.com/user-attachments/assets/d3d7b9e1-9cde-4209-92ed-80b27820d77e" />
</p>
<h1 align="center">AlphaClaw</h1>
<p align="center">
  <strong>Setup UI. Gateway manager. Watchdog. Zero config to production.</strong><br>
  <strong>One package. One command. Full OpenClaw infrastructure.</strong>
</p>

<p align="center">
  <a href="https://github.com/chrysb/alphaclaw/actions/workflows/ci.yml"><img src="https://github.com/chrysb/alphaclaw/actions/workflows/ci.yml/badge.svg" alt="CI" /></a>
  <a href="https://www.npmjs.com/package/@chrysb/alphaclaw"><img src="https://img.shields.io/npm/v/@chrysb/alphaclaw" alt="npm version" /></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-MIT-blue.svg" alt="License: MIT" /></a>
</p>

<p align="center">The management harness for <a href="https://github.com/openclaw/openclaw">OpenClaw</a> — a web-based Setup UI, gateway lifecycle manager, crash watchdog, and channel orchestrator that turns a bare OpenClaw install into a production-ready deployment.</p>

<p align="center">
  <a href="https://railway.com/deploy/openclaw-fast-start?referralCode=jcFhp_&utm_medium=integration&utm_source=template&utm_campaign=generic"><img src="https://railway.com/button.svg" alt="Deploy on Railway" /></a>
  <a href="https://render.com/deploy?repo=https://github.com/chrysb/openclaw-render-template"><img src="https://render.com/images/deploy-to-render-button.svg" alt="Deploy to Render" /></a>
</p>

> **Platform:** AlphaClaw currently targets Docker/Linux deployments. macOS local development is not yet supported.

## Features

- **Setup UI:** Password-protected web dashboard for onboarding, configuration, and day-to-day management.
- **Guided Onboarding:** Step-by-step setup wizard — model selection, provider credentials, GitHub repo, channel pairing.
- **Gateway Manager:** Spawns, monitors, restarts, and proxies the OpenClaw gateway as a managed child process.
- **Watchdog:** Crash detection, crash-loop recovery, auto-repair (`openclaw doctor --fix`), and Telegram/Discord notifications.
- **Channel Orchestration:** Telegram and Discord bot pairing, topic management, and credential sync from a single UI.
- **Webhooks:** Named webhook endpoints with per-hook transform modules, request logging, and payload inspection.
- **Google Workspace:** OAuth integration for Gmail, Calendar, Drive, Docs, Sheets, Tasks, Contacts, and Meet.
- **Prompt Hardening:** Ships anti-drift bootstrap prompts (`AGENTS.md`, `TOOLS.md`) injected into your agent's system prompt on every message — enforcing safe practices, commit discipline, and change summaries out of the box.
- **Git Sync:** Automatic hourly commits of your OpenClaw workspace to GitHub with configurable cron schedule. Combined with prompt hardening, every agent action is version-controlled and auditable.
- **Version Management:** In-place updates for both AlphaClaw and OpenClaw with changelog review and one-click apply.
- **Codex OAuth:** Built-in PKCE flow for OpenAI Codex CLI model access.

## Why AlphaClaw

- **Zero to production in one deploy:** Railway/Render templates ship a complete stack — no manual gateway setup.
- **Self-healing:** Watchdog detects crashes, enters repair mode, relaunches the gateway, and notifies you.
- **Everything in the browser:** No SSH, no config files to hand-edit, no CLI required after first deploy.
- **Stays out of the way:** AlphaClaw manages infrastructure; OpenClaw handles the AI.

## Quick Start

### Deploy (recommended)

[![Deploy on Railway](https://railway.com/button.svg)](https://railway.com/deploy/openclaw-fast-start?referralCode=jcFhp_&utm_medium=integration&utm_source=template&utm_campaign=generic)
[![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy?repo=https://github.com/chrysb/openclaw-render-template)

Set `SETUP_PASSWORD` at deploy time and visit your deployment URL. The welcome wizard handles the rest.

### Local / Docker

```bash
npm install @chrysb/alphaclaw
npx alphaclaw start
```

Or with Docker:

```dockerfile
FROM node:22-slim
RUN apt-get update && apt-get install -y git curl procps cron && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY package.json ./
RUN npm install --omit=dev
ENV PATH="/app/node_modules/.bin:$PATH"
ENV ALPHACLAW_ROOT_DIR=/data
EXPOSE 3000
CMD ["alphaclaw", "start"]
```

## Setup UI

| Tab           | What it manages                                                                                            |
| ------------- | ---------------------------------------------------------------------------------------------------------- |
| **General**   | Gateway status, channel health, pending pairings, Google Workspace, repo sync schedule, OpenClaw dashboard |
| **Watchdog**  | Health monitoring, crash-loop status, auto-repair toggle, notifications toggle, event log, live log tail   |
| **Providers** | AI provider credentials (Anthropic, OpenAI, Gemini, Mistral, Voyage, Groq, Deepgram) and model selection   |
| **Envars**    | Environment variables — view, edit, add — with gateway restart prompts                                     |
| **Webhooks**  | Webhook endpoints, transform modules, request history, payload inspection                                  |

## CLI

| Command                                                    | Description                                   |
| ---------------------------------------------------------- | --------------------------------------------- |
| `alphaclaw start`                                          | Start the server (Setup UI + gateway manager) |
| `alphaclaw git-sync -m "message"`                          | Commit and push the OpenClaw workspace        |
| `alphaclaw telegram topic add --thread <id> --name <text>` | Register a Telegram topic mapping             |
| `alphaclaw version`                                        | Print version                                 |
| `alphaclaw help`                                           | Show help                                     |

## Architecture

```mermaid
graph TD
    subgraph AlphaClaw
        UI["Setup UI<br/><small>Preact + htm + Wouter</small>"]
        WD["Watchdog<br/><small>Crash recovery · Notifications</small>"]
        WH["Webhooks<br/><small>Transforms · Request logging</small>"]
        UI --> API
        WD --> API
        WH --> API
        API["Express Server<br/><small>JSON APIs · Auth · Proxy</small>"]
    end

    API -- "proxy" --> GW["OpenClaw Gateway<br/><small>Child process · 127.0.0.1:18789</small>"]
    GW --> DATA["ALPHACLAW_ROOT_DIR<br/><small>.openclaw/ · .env · logs · SQLite</small>"]
```

## Watchdog

The built-in watchdog monitors gateway health and recovers from failures automatically.

| Capability                  | Details                                                        |
| --------------------------- | -------------------------------------------------------------- |
| **Health checks**           | Periodic `openclaw health` with configurable interval          |
| **Crash detection**         | Listens for gateway exit events                                |
| **Crash-loop detection**    | Threshold-based (default: 3 crashes in 300s)                   |
| **Auto-repair**             | Runs `openclaw doctor --fix --yes`, relaunches gateway         |
| **Notifications**           | Telegram and Discord alerts for crashes, repairs, and recovery |
| **Event log**               | SQLite-backed incident history with API and UI access          |

## Environment Variables

| Variable                          | Required | Description                                        |
| --------------------------------- | -------- | -------------------------------------------------- |
| `SETUP_PASSWORD`                  | Yes      | Password for the Setup UI                          |
| `OPENCLAW_GATEWAY_TOKEN`          | Auto     | Gateway auth token (auto-generated if unset)       |
| `GITHUB_TOKEN`                    | Yes      | GitHub PAT for workspace repo                      |
| `GITHUB_WORKSPACE_REPO`           | Yes      | GitHub repo for workspace sync (e.g. `owner/repo`) |
| `TELEGRAM_BOT_TOKEN`              | Optional | Telegram bot token                                 |
| `DISCORD_BOT_TOKEN`               | Optional | Discord bot token                                  |
| `WATCHDOG_AUTO_REPAIR`            | Optional | Enable auto-repair on crash (`true`/`false`)       |
| `WATCHDOG_NOTIFICATIONS_DISABLED` | Optional | Disable watchdog notifications (`true`/`false`)    |
| `PORT`                            | Optional | Server port (default `3000`)                       |
| `ALPHACLAW_ROOT_DIR`              | Optional | Data directory (default `/data`)                   |
| `TRUST_PROXY_HOPS`                | Optional | Trust proxy hop count for correct client IP        |

## Security Notes

AlphaClaw is a convenience wrapper — it intentionally trades some of OpenClaw's default hardening for ease of setup. You should understand what's different:

| Area                    | What AlphaClaw does                                                                                                                   | Trade-off                                                                                              |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| **Setup password**      | All gateway access is gated behind a single `SETUP_PASSWORD`. Brute-force protection is built in (exponential backoff lockout).       | Simpler than OpenClaw's pairing code flow, but the password must be strong.                            |
| **One-click pairing**   | Channel pairings (Telegram/Discord) can be approved from the Setup UI instead of the CLI.                                             | No terminal access required, but anyone with the setup password can approve pairings.                  |
| **Auto CLI approval**   | The first CLI device pairing is auto-approved so you can connect without a second screen. Subsequent requests appear in the UI.       | Removes the manual pairing step for the initial CLI connection.                                        |
| **Query-string tokens** | Webhook URLs support `?token=<WEBHOOK_TOKEN>` for providers that don't support `Authorization` headers. Warnings are shown in the UI. | Tokens may appear in server logs and referrer headers. Use header auth when your provider supports it. |
| **Gateway token**       | `OPENCLAW_GATEWAY_TOKEN` is auto-generated and injected into the environment so the proxy can authenticate with the gateway.          | The token lives in the `.env` file on the server — standard for managed deployments but worth noting.  |

If you need OpenClaw's full security posture (manual pairing codes, no query-string tokens, no auto-approval), use OpenClaw directly without AlphaClaw.

## Development

```bash
npm install
npm test                # Full suite (90 tests)
npm run test:watchdog   # Watchdog-focused suite (14 tests)
npm run test:watch      # Watch mode
npm run test:coverage   # Coverage report
```

**Requirements:** Node.js ≥ 22.12.0

## License

MIT
