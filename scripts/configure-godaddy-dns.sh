#!/usr/bin/env bash
# Configure dokind.ai DNS at GoDaddy for Vercel hosting.
# Requires GoDaddy production API credentials:
#   export GODADDY_API_KEY=...
#   export GODADDY_API_SECRET=...
set -euo pipefail

DOMAIN="${GODADDY_DOMAIN:-dokind.ai}"
VERCEL_IP="${VERCEL_A_RECORD:-76.76.21.21}"
TTL="${GODADDY_TTL:-600}"

if [[ -z "${GODADDY_API_KEY:-}" || -z "${GODADDY_API_SECRET:-}" ]]; then
  echo "Missing GODADDY_API_KEY or GODADDY_API_SECRET."
  echo "Create a Production API key at https://developer.godaddy.com/keys"
  exit 1
fi

auth="sso-key ${GODADDY_API_KEY}:${GODADDY_API_SECRET}"
api="https://api.godaddy.com/v1/domains/${DOMAIN}/records"

upsert_a() {
  local name="$1"
  echo "Setting A record ${name}.${DOMAIN} -> ${VERCEL_IP}"
  curl -fsS -X PUT "${api}/A/${name}" \
    -H "Authorization: ${auth}" \
    -H "Content-Type: application/json" \
    --data "[{\"data\":\"${VERCEL_IP}\",\"ttl\":${TTL}}]"
  echo
}

upsert_a "@"
upsert_a "www"

echo "Done. Verify with: dig +short ${DOMAIN} A && dig +short www.${DOMAIN} A"
