# Database backup & failover

Production runs on Render Postgres. Every night `.github/workflows/db-backup.yml`
keeps two copies off Render:

| Copy | Where | Use it for |
|---|---|---|
| Encrypted `pg_dump` | GitHub Actions artifact, 30 days | Going back to a specific day, restoring anywhere |
| Standby database | Neon | Fast failover: just repoint `DATABASE_URL` |

The standby is restored from the full dump, so it has the same tables, data and
`django_migrations` history as production. Each run checks that both databases
report the same migrations and fails if they don't.

## One-time setup

1. **Create the Neon standby**: sign in at [neon.tech](https://neon.tech) →
   *New Project*. Pick the same Postgres version as Render (shown on the Render
   database page) and a region close to Render's (e.g. AWS Frankfurt if Render
   is in Frankfurt). Leave the default `neondb` database.
2. **Copy Neon's connection string**: project dashboard → *Connect*. Turn
   **off** "Connection pooling" so the host has no `-pooler` in it (the restore
   doesn't work reliably through the pooler). It looks like
   `postgresql://neondb_owner:...@ep-xxxx.eu-central-1.aws.neon.tech/neondb?sslmode=require`.
3. **Get Render's external URL**: Render dashboard → database → Connections →
   *External Database URL*.
4. **Generate a passphrase**, e.g. `python -c "import secrets; print(secrets.token_urlsafe(32))"`.
   Store it in a password manager too. **Without it, the dumps can't be decrypted.**
5. In GitHub: repo → Settings → Secrets and variables → Actions → *New repository secret*:
   - `PRIMARY_DATABASE_URL`: Render external URL
   - `BACKUP_DATABASE_URL`: Neon connection string (direct, not pooled)
   - `BACKUP_PASSPHRASE`: the passphrase
6. Actions tab → *Database backup* → **Run workflow** to test it. The run summary
   shows migration and user counts for both databases.

If Render's database is a newer major version than `PG_MAJOR` in the workflow,
bump `PG_MAJOR`.

**Neon free tier notes:** storage is capped (0.5 GB at the time of writing), so
check the project's storage usage occasionally as the database grows. The
compute sleeps when idle and wakes on the first connection, so the first
request after failover may take a second longer.

## Failover: Render's database is down

1. Render dashboard → the backend web service → Environment → set `DATABASE_URL`
   to the Neon connection string → Save (this redeploys). For the live app you
   can use Neon's **pooled** connection string (with `-pooler`), which handles
   many connections better.
2. The Build Command should run `migrate` as usual. The standby already has the
   migration history, so it only applies migrations newer than the last backup.
3. **Disable the backup workflow** (Actions → Database backup → ⋯ → Disable)
   while you're on the standby. Otherwise the next nightly run will try to
   restore the old primary over your live data.

Data written after the last backup (up to ~24h) only exists on Render. Once
Render recovers, check whether anything important needs copying over.

### Moving back to Render

```bash
pg_dump "$STANDBY_URL" --format=custom --no-owner --no-privileges -f standby.dump
pg_restore --dbname="$RENDER_URL" --clean --if-exists --no-owner --no-privileges standby.dump
```

Then set `DATABASE_URL` back to Render's internal URL and re-enable the workflow.

## Restoring a specific day's dump

Download the artifact from the workflow run (Actions → run → Artifacts), unzip it, then:

```bash
gpg --decrypt nacos-<stamp>.dump.gpg > nacos.dump      # prompts for the passphrase
pg_restore --dbname="$TARGET_URL" --clean --if-exists --no-owner --no-privileges nacos.dump
```

To restore a single table instead, add `--table=<name>` (e.g. `--table=events_ticket`).
Run `pg_restore --list nacos.dump` to see what's inside.

## Also worth enabling

Paid Render databases include point-in-time recovery (restore to any moment in
the last few days) from the database's *Recovery* tab. That covers the "someone
deleted rows an hour ago" case better than a nightly dump. Free Render databases
have no backups and expire, so production shouldn't be on the free tier.
