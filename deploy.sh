#!/bin/bash
# Run this ON THE EC2 SERVER (not locally) to deploy the latest main branch.
#   ssh -i ~/.ssh/nacos_ec2_key ubuntu@<host>
#   cd /home/ubuntu/nacos_website && ./deploy.sh
#
# Records the commit you were on before pulling, so a bad deploy can be
# undone with ./rollback.sh <the-printed-sha>.
set -e

cd "$(dirname "$0")"

PREV_COMMIT=$(git rev-parse HEAD)
echo "=== Current commit (save this — needed for rollback) ==="
echo "$PREV_COMMIT"
echo "$PREV_COMMIT" > .last_deploy_commit

echo "=== Pulling latest main ==="
git pull origin main

echo "=== Running migrations ==="
cd backend
source ../venv/bin/activate
python manage.py migrate
cd ..

echo "=== Restarting gunicorn ==="
sudo systemctl restart gunicorn.service

echo "=== Health check ==="
sleep 2
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" --max-time 10 https://api.nacosabuad.org/api/projects/)
if [ "$HTTP_CODE" = "200" ]; then
    echo "Deploy OK — API responded 200."
else
    echo "WARNING: API responded with $HTTP_CODE, not 200."
    echo "Previous commit was $PREV_COMMIT — to roll back, run:"
    echo "  ./rollback.sh $PREV_COMMIT"
fi
