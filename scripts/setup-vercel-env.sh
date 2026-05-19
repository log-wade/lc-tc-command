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
eleven=""
boat_env="$HOME/Boat Mechanic Agent/.env"
if [[ -f "$HOME/hive-mind-agent-general/.env" ]]; then
  anthropic=$(grep '^ANTHROPIC_API_KEY=' "$HOME/hive-mind-agent-general/.env" | cut -d= -f2- | tr -d '"')
fi
if [[ -f "$boat_env" ]]; then
  eleven=$(grep '^ELEVENLABS_API_KEY=' "$boat_env" | cut -d= -f2- | tr -d '"')
fi

agent_secret=$(openssl rand -hex 24)

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
[[ -n "$eleven" ]] && add ELEVENLABS_API_KEY "$eleven"
add AGENT_WEBHOOK_SECRET "$agent_secret"
add AGENT_WEBHOOK_BASE_URL "https://lc-tc-platform.vercel.app"
add ALERT_EMAIL "carly.bryant@kw.com"
add EMAIL_FROM "Carly Bryant <onboarding@resend.dev>"
echo "Done. Run: npm run agent:setup  # then add NEXT_PUBLIC_ELEVENLABS_AGENT_ID to Vercel"
echo "Done. Run: vercel deploy --prod"
