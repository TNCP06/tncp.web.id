#!/usr/bin/env bash
# Encrypted daily backup of tncp.web.id -> Telegram. Runs on the VPS host via cron.
# No new container; reads the app's bind-mounted /data directly.
#
# Secrets come from a host-only config file (NOT this repo), default:
#   $APP_DIR/backup.env  (chmod 600), defining:
#     BACKUP_PASSPHRASE=...   # encryption passphrase (store in a password manager!)
#     TG_BOT_TOKEN=...        # Telegram bot token
#     TG_CHAT_ID=...          # target chat/channel id for backups
#     TG_API=https://api.telegram.org   # optional; use the self-hosted bot-api for >50MB
#
# Restore: see docs/backup.md.
set -euo pipefail

APP_DIR="${APP_DIR:-/home/ec2-user/tncp.web.id}"
CONF="${BACKUP_CONF:-$APP_DIR/backup.env}"
DATA_DIR="$APP_DIR/data"
DB="$DATA_DIR/tncp.db"
MEDIA="$DATA_DIR/media"
BACKUP_DIR="$APP_DIR/backups"
LOG="$APP_DIR/backup.log"
KEEP=3
TS="$(date +%Y%m%d-%H%M%S)"

log() { echo "$(date '+%F %T') $*" | tee -a "$LOG"; }
fail() { log "ERROR: $*"; exit 1; }

[ -f "$CONF" ] || fail "config not found: $CONF"
# shellcheck disable=SC1090
set -a; . "$CONF"; set +a
: "${BACKUP_PASSPHRASE:?set in $CONF}"
: "${TG_BOT_TOKEN:?set in $CONF}"
: "${TG_CHAT_ID:?set in $CONF}"
TG_API="${TG_API:-https://api.telegram.org}"
[ -f "$DB" ] || fail "db not found: $DB"

mkdir -p "$BACKUP_DIR"
WORK="$(mktemp -d)"
trap 'rm -rf "$WORK"' EXIT

log "backup start ($TS)"

# 1) Consistent SQLite snapshot (sqlite backup API handles locking while the app writes).
python3 - "$DB" "$WORK/tncp.db" <<'PY'
import sqlite3, sys
src, dst = sys.argv[1], sys.argv[2]
s = sqlite3.connect(src); d = sqlite3.connect(dst)
with d: s.backup(d)
s.close(); d.close()
PY
log "sqlite snapshot ok ($(du -h "$WORK/tncp.db" | cut -f1))"

# 2) Archive snapshot + media + deploy config.
tar -czf "$WORK/archive.tar.gz" \
  -C "$WORK" tncp.db \
  -C "$DATA_DIR" media \
  -C "$APP_DIR" docker-compose.yml .env 2>/dev/null || true
log "archive built ($(du -h "$WORK/archive.tar.gz" | cut -f1))"

# 3) Encrypt (AES-256-CBC, PBKDF2). Passphrase via env (not argv).
ENC="$BACKUP_DIR/tncp-backup-$TS.tar.gz.enc"
openssl enc -aes-256-cbc -pbkdf2 -salt -pass env:BACKUP_PASSPHRASE \
  -in "$WORK/archive.tar.gz" -out "$ENC"
log "encrypted -> $(basename "$ENC") ($(du -h "$ENC" | cut -f1))"

# 4) Ship to Telegram.
# When TG_CHAT_ID is the tcd storage channel, this caption follows tcd's index
# contract ("Folder/Title | part/total | tags") so tcd's bot auto-files the
# backup in the drive under $TG_FOLDER/. For a plain chat it is just a caption.
TG_FOLDER="${TG_FOLDER:-backup}"
HTTP=$(curl -s -o "$WORK/tg.json" -w '%{http_code}' \
  -F "chat_id=$TG_CHAT_ID" \
  -F "document=@$ENC" \
  -F "caption=$TG_FOLDER/tncp-backup-$TS | 1/1 | backup" \
  "$TG_API/bot$TG_BOT_TOKEN/sendDocument")
if [ "$HTTP" = "200" ] && grep -q '"ok":true' "$WORK/tg.json"; then
  log "telegram upload ok"
else
  fail "telegram upload failed (http $HTTP): $(head -c 300 "$WORK/tg.json")"
fi

# 5) Retain only the last $KEEP local archives.
ls -1t "$BACKUP_DIR"/tncp-backup-*.tar.gz.enc 2>/dev/null | tail -n +$((KEEP + 1)) | xargs -r rm -f
log "backup done; local copies kept: $(ls -1 "$BACKUP_DIR"/tncp-backup-*.tar.gz.enc 2>/dev/null | wc -l)"
