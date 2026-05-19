# LC/TC Command

Automated **Listing & Transaction Coordination** platform for Texas residential real estate — built from the [Automated LC/TC System Design Document](../Automated_LC_TC_System_Design_Document.docx) (Carly Bryant, KW Austin Northwest, v1.0).

## Architecture (8 Layers)

| Layer | Implementation |
|-------|----------------|
| 1. Intake | LC + TC web forms → API routes |
| 2. Data | Supabase Postgres (memory fallback for demo) |
| 3. Deadline Engine | Texas residential formulas from effective date |
| 4. Communications | 10-template library + Resend email |
| 5. Integrations | Adapter layer (MLS, DocuSign, ShowingTime, title) — live when API keys set |
| 6. AI Agent | Claude — inbox triage, draft polish, wire-fraud P0 |
| 7. Human-in-Loop | Review queue — go-live, comms, escalations |
| 8. Audit | Full action log — broker dashboard |

## Quick Start

```bash
cd lc-tc-platform
npm install
cp .env.example .env.local
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Without Supabase env vars, the app runs in **demo mode** with seeded sample files.

## Environment

See `.env.example`. Production is configured on Vercel with:

| Variable | Status |
|----------|--------|
| `NEXT_PUBLIC_SUPABASE_URL` | ✅ [lc-tc-command](https://supabase.com/dashboard/project/mueadgepbcguidxnuqxj) |
| `SUPABASE_SERVICE_ROLE_KEY` | ✅ Set on Vercel |
| `ANTHROPIC_API_KEY` | ✅ AI triage live |
| `CRON_SECRET` | ✅ Deadline + Tuesday crons |
| `RESEND_API_KEY` | ⏳ Add for real outbound email (simulated until set) |
| `ELEVENLABS_API_KEY` | ✅ Voice + ConvAI agent |
| `NEXT_PUBLIC_ELEVENLABS_AGENT_ID` | ✅ Production agent |
| `AGENT_WEBHOOK_SECRET` | ✅ Tool webhooks for voice agent |

Re-sync env to Vercel after key rotation:

```bash
./scripts/setup-vercel-env.sh
vercel deploy --prod
```

Local dev: `vercel env pull .env.local`

## Deploy (Vercel)

```bash
vercel link
vercel env pull .env.local
vercel --prod
```

Cron jobs (deadline reminders, Tuesday updates, review SLA) are configured in `vercel.json`.

## Enterprise platform (Phases 1–5)

After pulling, apply migration `004_enterprise_platform.sql` in the Supabase SQL editor (or `supabase db push`), then create the first admin:

```bash
export $(grep -v '^#' .env.local | xargs)
npm run seed:admin -- you@example.com 'secure-password'
```

| Phase | Features |
|-------|----------|
| 1 | Supabase Auth, RLS, middleware, login, memory demo disabled in production |
| 2 | File events, workflow runs, review SLA cron, inbound email webhook |
| 3 | Integration adapters (`src/lib/integrations/`) |
| 4 | AI policy guardrails, agent audit log, `/broker` dashboard |
| 5 | Multi-tenant orgs, API keys, `/api/v1/listings` & `/api/v1/transactions` |

Create an API key: `node scripts/create-api-key.mjs "Integration name"`

Set `AUTH_DISABLED=true` only for local dev without login. Production requires a seeded user.

## Compliance Notes

- System does **not** replace licensed agents — human checkpoints on go-live, amendments, wire changes.
- Wire-instruction changes via email → **P0** auto-escalation; phone verification required.
- All outbound comms require template or licensee-reviewed draft.

## License

Proprietary — Keller Williams Realty Austin Northwest Market Center operational use.
