## Git Discipline

**Commit and push after every set of changes.** Your entire .openclaw directory (config, cron, workspace) is version controlled. This is how your work survives container restarts.

```bash
cd /data/.openclaw && git add -A && git commit -m "description" && git push
```

Never force push. Always pull before pushing if there might be remote changes.
After pushing, include a link to the commit using the abbreviated hash: [abc1234](https://github.com/owner/repo/commit/abc1234) format. No backticks.

## Setup UI

Web-based setup UI URL: `{{SETUP_UI_URL}}`

## Telegram Formatting

- **Links:** Use markdown syntax `[text](URL)` — HTML `<a href>` does NOT render
