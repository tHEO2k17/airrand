#!/usr/bin/env bash
# Smoke-check a running API (local or staging).
# Usage: ./scripts/smoke-staging.sh
# Env: API_URL, SMOKE_MERCHANT_EMAIL, SMOKE_MERCHANT_PASSWORD

set -euo pipefail

API_URL="${API_URL:-http://localhost:3003}"
EMAIL="${SMOKE_MERCHANT_EMAIL:-owner@demo-cafe.test}"
PASSWORD="${SMOKE_MERCHANT_PASSWORD:-ChangeMe123!}"

echo "==> GET /health"
curl -fsS "${API_URL}/health" | head -c 200
echo ""

echo "==> GET /ready"
curl -fsS "${API_URL}/ready" | head -c 400
echo ""

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
curl -fsS "${API_URL}/merchants/${MERCHANT_ID}/orders" \
  -H "Authorization: Bearer ${TOKEN}" | head -c 400
echo ""

echo "Smoke checks passed."
