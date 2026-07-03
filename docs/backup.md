# Backup

> Last verified against code: 2026-07-03 (Stage A scaffold — implemented in Stage F)

Daily encrypted backup: SQLite snapshot (`sqlite3 .backup`) + `/data/media` archive + compose/env → the owner's Telegram channel via the existing VPS uploader (no new container).

- Encryption: age or `openssl enc -aes-256-cbc -pbkdf2`; passphrase from a host file (`chmod 600`), never in the repo.
- Idempotent, logs to a file, keeps the last 3 local archives.

## Restore

TODO (Stage F). **A backup that has never been restored is not a backup — test restore once.**

⚠️ Without the passphrase the backup cannot be opened. Store it in a password manager.
