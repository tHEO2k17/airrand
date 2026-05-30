#!/usr/bin/env bash
# Smoke-check a running API (local or staging).
# Usage: ./scripts/smoke-staging.sh
# Env: API_URL, REDIS_URL (optional — direct PING), SMOKE_MERCHANT_EMAIL, SMOKE_MERCHANT_PASSWORD

set -euo pipefail

API_URL="${API_URL:-http://localhost:3003}"
EMAIL="${SMOKE_MERCHANT_EMAIL:-owner@demo-cafe.test}"
PASSWORD="${SMOKE_MERCHANT_PASSWORD:-ChangeMe123!}"

echo "==> GET /health"
curl -fsS "${API_URL}/health" | head -c 200
echo ""

echo "==> GET /ready"
READY_JSON="$(curl -fsS "${API_URL}/ready")"
echo "${READY_JSON}" | head -c 500
echo ""

node -e "
  const body = JSON.parse(process.argv[1]);
  const checks = body?.data?.checks;
  if (!checks) {
    console.error('Missing data.checks in /ready response');
    process.exit(1);
  }
  for (const key of ['database', 'redis', 'secrets']) {
    if (!(key in checks)) {
      console.error('Missing readiness check:', key);
      process.exit(1);
    }
  }
  if (checks.database !== 'ok' || checks.secrets !== 'ok') {
    console.error('Readiness failed:', JSON.stringify(checks));
    process.exit(1);
  }
  if (checks.redis === 'failed') {
    console.error('Redis readiness failed');
    process.exit(1);
  }
  console.log('Readiness checks:', JSON.stringify(checks));
" "${READY_JSON}"

if [[ -n "${REDIS_URL:-}" ]]; then
  echo "==> Redis PING (${REDIS_URL})"
  if command -v redis-cli >/dev/null 2>&1; then
    redis-cli -u "${REDIS_URL}" ping | grep -q PONG
    echo "Redis PONG"
  else
    echo "REDIS_URL is set but redis-cli is not installed; relying on /ready redis check only"
  fi
fi

echo "==> GET /merchants"
MERCHANTS_JSON="$(curl -fsS "${API_URL}/merchants")"
echo "${MERCHANTS_JSON}" | head -c 300
echo ""

MERCHANT_ID="$(node -e "
  const body = JSON.parse(process.argv[1]);
  const id = body?.data?.merchants?.[0]?.id;
  if (!id) process.exit(1);
  process.stdout.write(id);
" "${MERCHANTS_JSON}")"

echo "==> POST /auth/merchant/login"
LOGIN_JSON="$(curl -fsS -X POST "${API_URL}/auth/merchant/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"${EMAIL}\",\"password\":\"${PASSWORD}\"}")"
echo "${LOGIN_JSON}" | head -c 300
echo ""

TOKEN="$(node -e "
  const body = JSON.parse(process.argv[1]);
  const token = body?.data?.token;
  if (!token) process.exit(1);
  process.stdout.write(token);
" "${LOGIN_JSON}")"

echo "==> GET /merchants/${MERCHANT_ID}/orders (authenticated)"
ORDERS_RES="$(curl -fsS -w '\n%{http_code}' "${API_URL}/merchants/${MERCHANT_ID}/orders" \
  -H "Authorization: Bearer ${TOKEN}")"
HTTP_CODE="$(echo "${ORDERS_RES}" | tail -n1)"
BODY="$(echo "${ORDERS_RES}" | sed '$d')"
echo "${BODY}" | head -c 400
echo ""
if [[ "${HTTP_CODE}" != "200" ]]; then
  echo "Expected HTTP 200, got ${HTTP_CODE}"
  exit 1
fi

echo "Smoke checks passed."
