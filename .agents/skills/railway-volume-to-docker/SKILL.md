---
name: railway-volume-to-docker
description: Sync runtime data from a Railway deployment into local Docker for realistic testing. Use when the user asks to copy Railway data, clone production state locally, or test with real usage/session/config data.
---

# Railway Volume To Docker

Copy a Railway service's `/data` volume into local Docker (`openclaw-railway-template`) so local testing uses real runtime data.

## When to use

- User asks to test locally with "real data"
- User asks to sync Railway deployment data into Docker
- User asks to copy production usage/session/config state to local

## Preconditions

1. Railway CLI is installed and logged in.
2. Local repo `~/Projects/openclaw-railway-template` exists.
3. Service uses `/data` as persistent root (`ALPHACLAW_ROOT_DIR=/data`).
4. User accepts that secrets/tokens may be copied locally.

## Safety notes

- This process can copy sensitive data (`/data/.env`, sessions, logs).
- Never commit snapshot files.
- Prefer local secure machine only.
- Remove snapshot artifacts after restore.

## Workflow

Run these commands from `~/Projects/openclaw-railway-template`.

### 1) Confirm Railway target

```bash
railway status
```

Expected output should show project/environment/service linked to the intended deployment.

### 2) Verify remote volume path exists

```bash
railway ssh -- sh -lc "pwd && ls -la /data"
```

If `/data` is missing, stop and confirm service/container setup.

### 3) Build a remote snapshot archive

Use tolerant tar flags because live files can change during read.

```bash
railway ssh -- tar --warning=no-file-changed --ignore-failed-read -czf /tmp/railway-data.tgz -C /data .
railway ssh -- ls -lh /tmp/railway-data.tgz
```

### 4) Download snapshot (text-safe transfer)

Do not stream binary tar directly; use base64 to avoid transport corruption.

```bash
rm -f railway-data.tgz railway-data.tgz.b64
railway ssh -- base64 -w0 /tmp/railway-data.tgz > railway-data.tgz.b64
base64 -D -i railway-data.tgz.b64 -o railway-data.tgz
file railway-data.tgz
tar -tzf railway-data.tgz > /dev/null && echo "archive_ok"
```

On Linux, use `base64 --decode railway-data.tgz.b64 > railway-data.tgz` instead of `base64 -D`.

### 5) Restore snapshot into local Docker volume

```bash
docker compose up -d openclaw
CONTAINER_ID=$(docker compose ps -q openclaw)
VOLUME_NAME=$(docker inspect "$CONTAINER_ID" --format '{{range .Mounts}}{{if eq .Destination "/data"}}{{.Name}}{{end}}{{end}}')
docker compose stop openclaw
docker run --rm -v "$VOLUME_NAME":/data -v "$PWD":/backup alpine sh -lc "rm -rf /data/* /data/.[!.]* /data/..?* 2>/dev/null || true; cd /data && tar -xzf /backup/railway-data.tgz"
docker compose up -d openclaw
```

### 6) Verify restored data

```bash
docker compose exec openclaw sh -lc "ls -la /data && ls -la /data/db"
docker compose exec openclaw sh -lc "node -e \"const { DatabaseSync } = require('node:sqlite'); const db = new DatabaseSync('/data/db/usage.db', { readOnly: true }); console.log(db.prepare('select count(*) as c from usage_events').get());\""
```

### 7) Cleanup temp archives

```bash
railway ssh -- rm -f /tmp/railway-data.tgz
rm -f railway-data.tgz railway-data.tgz.b64
```

## Troubleshooting

- **`railway run` did not access remote container**
  - Use `railway ssh` for remote execution. `railway run` is local env injection.
- **`tar: file changed as we read it`**
  - Use `--warning=no-file-changed --ignore-failed-read`.
- **`invalid tar header checksum` on restore**
  - Binary transfer likely corrupted; re-download via base64 workflow.
- **Decode command fails on macOS**
  - Use `base64 -D -i <input> -o <output>`.
- **Container fails after restore**
  - Check logs: `docker compose logs --tail=200 openclaw`
  - Re-run restore if archive integrity check failed.

## Response checklist

After running, report:

1. Railway target used (project/env/service)
2. Snapshot size
3. Restore success/failure
4. Verification result (e.g. `usage_events` count)
5. Whether temp archives were cleaned
