#!/bin/bash
# Run this ON THE EC2 SERVER to roll back to a previous commit after a bad
# deploy.
#   ./rollback.sh <commit-sha>
#
# If you don't have the sha handy, deploy.sh saves the pre-deploy commit to
# .last_deploy_commit every time it runs:  cat .last_deploy_commit
#
# IMPORTANT CAVEAT: this only rolls back CODE. If the deploy you're
# reverting included a migration that renamed/dropped a column or table
# (not just added one), the database schema will still be on the NEWER
# shape and this rollback can break. Check `git log --oneline -- backend/*/migrations`
# between the two commits first — if it's purely additive (new
# fields/tables), a code-only rollback is safe. If it renamed/removed
# something, you need to also run
# `python manage.py migrate <app> <previous_migration_name>` before restarting.
set -e

if [ -z "$1" ]; then
    echo "Usage: ./rollback.sh <commit-sha>"
    echo "Tip: cat .last_deploy_commit"
    exit 1
fi

cd "$(dirname "$0")"

echo "=== Rolling back to $1 ==="
git checkout "$1"

echo "=== Running migrations (forward-only — see caveat above for schema-changing rollbacks) ==="
cd backend
source ../venv/bin/activate
python manage.py migrate
cd ..

echo "=== Restarting gunicorn ==="
sudo systemctl restart gunicorn.service

echo "=== Health check ==="
sleep 2
curl -s -o /dev/null -w "API HTTP: %{http_code}\n" --max-time 10 https://api.nacosabuad.org/api/projects/

echo ""
echo "Rolled back to $1. Note: this leaves the repo in a 'detached HEAD' state"
echo "(not on the main branch) — that's fine for the server to keep running,"
echo "but before deploying again you'll want to decide whether to fix forward"
echo "on main and re-deploy, or reset main itself back to this commit."
