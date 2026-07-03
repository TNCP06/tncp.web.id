# Backup

> Last verified against code: 2026-07-03 (Stage F — `scripts/backup.sh`)

Daily encrypted backup of the app's `/data` (SQLite + media) + deploy config, shipped to Telegram. Host cron, no new container — the script reads the bind-mounted `data/` dir directly.

## What runs

`scripts/backup.sh` (on the VPS host):
1. Consistent SQLite snapshot via Python's `sqlite3` backup API (safe while the app writes).
2. `tar` the snapshot + `data/media` + `docker-compose.yml` + `.env`.
3. Encrypt: `openssl enc -aes-256-cbc -pbkdf2` with a passphrase.
4. Upload to Telegram (`sendDocument`, ≤50 MB on the public Bot API — our data is well under).
5. Keep the last 3 local archives in `backups/`, log to `backup.log`.

## Config (host-only, never in the repo)

`$APP_DIR/backup.env` (`chmod 600`):

```
BACKUP_PASSPHRASE=<strong random passphrase>
TG_BOT_TOKEN=<telegram bot token>
TG_CHAT_ID=<target chat/channel id>
# TG_API=http://127.0.0.1:8081   # optional: self-hosted bot-api for archives >50 MB
```

## Drive visibility (via tcd)

If `TG_CHAT_ID` is the **tcd storage channel** (the one tcd indexes) and `TG_BOT_TOKEN`'s bot is an **admin of that channel but not tcd's own indexer bot**, the caption `Backup/tncp.web.id/tncp-backup-<ts> | 1/1 | backup` follows tcd's index contract, so tcd's bot auto-files the archive in the cloud-drive under `Backup/tncp.web.id/` (`TG_FOLDER`, default `Backup/tncp.web.id` — mirrors tcd's own `Backup/CDT DB/`). The file lives in Telegram regardless — if tcd's indexer changes, the backup is still safe, only the drive listing is affected. No writes to tcd's database.

## Schedule

Host cron (daily 03:15):
```
15 3 * * * /home/ec2-user/tncp.web.id/scripts/backup.sh >> /home/ec2-user/tncp.web.id/backup.log 2>&1
```

## Restore

1. Download the `.tar.gz.enc` from Telegram to the VPS (or any host).
2. Decrypt:
   ```
   openssl enc -d -aes-256-cbc -pbkdf2 -pass pass:'<BACKUP_PASSPHRASE>' \
     -in tncp-backup-<ts>.tar.gz.enc -out restore.tar.gz
   ```
3. Extract: `tar -xzf restore.tar.gz` → yields `tncp.db`, `media/`, `docker-compose.yml`, `.env`.
4. Stop the app, replace the live data, start:
   ```
   cd /home/ec2-user/tncp.web.id
   docker compose stop
   cp tncp.db data/tncp.db
   rm -rf data/media && cp -r media data/media
   docker compose up -d
   ```
5. Verify `curl http://127.0.0.1:3100/api/health` and the homepage.

> ⚠️ **Without `BACKUP_PASSPHRASE` the archive cannot be opened.** Store it in a password manager. A backup you have never restored is not a backup — test the restore once.
