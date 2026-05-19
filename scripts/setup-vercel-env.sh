#!/usr/bin/env bash
# Sync Supabase + Anthropic env vars to Vercel production (no secrets printed)
set -euo pipefail
REF="${SUPABASE_PROJECT_REF:-mueadgepbcguidxnuqxj}"
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

keys=$(supabase projects api-keys --project-ref "$REF" -o json)
anon=$(echo "$keys" | python3 -c "import sys,json; d=json.load(sys.stdin); print(next(k['api_key'] for k in d if k.get('name')=='anon'))")
service=$(echo "$keys" | python3 -c "import sys,json; d=json.load(sys.stdin); print(next(k['api_key'] for k in d if k.get('name')=='service_role'))")

anthropic=""
if [[ -f "$HOME/hive-mind-agent-general/.env" ]]; then
  anthropic=$(grep '^ANTHROPIC_API_KEY=' "$HOME/hive-mind-agent-general/.env" | cut -d= -f2- | tr -d '"')
fi

add() {
  vercel env rm "$1" production -y 2>/dev/null || true
  printf '%s' "$2" | vercel env add "$1" production >/dev/null
  echo "Set $1"
}

add NEXT_PUBLIC_SUPABASE_URL "https://${REF}.supabase.co"
add NEXT_PUBLIC_SUPABASE_ANON_KEY "$anon"
add SUPABASE_SERVICE_ROLE_KEY "$service"
[[ -n "$anthropic" ]] && add ANTHROPIC_API_KEY "$anthropic"
add ANTHROPIC_MODEL "claude-sonnet-4-20250514"
add ALERT_EMAIL "carly.bryant@kw.com"
add EMAIL_FROM "Carly Bryant <onboarding@resend.dev>"
echo "Done. Run: vercel deploy --prod"
