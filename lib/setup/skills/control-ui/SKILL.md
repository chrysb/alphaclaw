---
name: alphaclaw
description: Know when and how to direct the user to the AlphaClaw UI for configuration tasks.
---

# AlphaClaw UI

There is a web-based Setup UI at `{{BASE_URL}}`. The **user** manages runtime configuration through it. You should NOT call these API endpoints yourself or write config files directly — instead, tell the user what they need to do and where to do it.

## When to direct the user to the UI

### Adding or changing environment variables

When the user needs to add a new API key, token, or any env var:

> You can add that in your Setup UI → **Envars** tab: {{BASE_URL}}#envars

### Connecting a new channel (Telegram, Discord)

> Add your bot token in the Setup UI → **Envars** tab ({{BASE_URL}}#envars), then approve the pairing request in the **General** tab ({{BASE_URL}}#general).

### Approving or rejecting pairings

When a user asks about pairing their Telegram or Discord account:

> Open the Setup UI → **General** tab ({{BASE_URL}}#general). Pending pairing requests appear automatically — click **Approve** or **Reject**.

### Connecting OpenAI Codex OAuth

> Connect or reconnect Codex OAuth from the Setup UI → **Providers** tab ({{BASE_URL}}#providers). Click **Connect Codex OAuth** and follow the popup flow.

### Connecting Google Workspace

> Set up Google Workspace from the Setup UI → **General** tab ({{BASE_URL}}#general, Google section). You'll need your OAuth client credentials from Google Cloud Console.

Supported Google services (user selects which to enable during OAuth):

| Service  | Read            | Write            | Google API                     |
| -------- | --------------- | ---------------- | ------------------------------ |
| Gmail    | `gmail:read`    | `gmail:write`    | `gmail.googleapis.com`         |
| Calendar | `calendar:read` | `calendar:write` | `calendar-json.googleapis.com` |
| Drive    | `drive:read`    | `drive:write`    | `drive.googleapis.com`         |
| Sheets   | `sheets:read`   | `sheets:write`   | `sheets.googleapis.com`        |
| Docs     | `docs:read`     | `docs:write`     | `docs.googleapis.com`          |
| Tasks    | `tasks:read`    | `tasks:write`    | `tasks.googleapis.com`         |
| Contacts | `contacts:read` | `contacts:write` | `people.googleapis.com`        |
| Meet     | `meet:read`     | `meet:write`     | `meet.googleapis.com`          |

Default enabled: Gmail (read), Calendar (read+write), Drive (read), Sheets (read), Docs (read).

The `gog` CLI is available to verify Google API access:

```bash
gog auth list --plain
gog gmail labels list --account user@gmail.com
gog calendar calendars --account user@gmail.com
gog drive ls --account user@gmail.com
gog sheets metadata SPREADSHEET_ID --account user@gmail.com
gog contacts list --account user@gmail.com
```

Config lives at `/data/.openclaw/gogcli/`.
