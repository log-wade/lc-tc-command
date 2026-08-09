# Hive Context

## Goals
- Ship email template revisions follow-ups safely
- Close operational gaps (tests, cleanup, closing prep UX, env readiness)
- Prepare for commit/PR and production smoke verification

## Strategy
Run parallel implementers for independent app-code tasks. Use CLI for git/Vercel/Supabase when MCP connectors are down. Surface connector auth needs to the human immediately.

## Pending Tasks
| ID | Description | Assigned | Status |
|----|-------------|----------|--------|
| H1 | Cleanup accidental `* 2.*` duplicate files | worker | completed |
| H2 | Add automated email template regression tests | worker | completed |
| H3 | Closing prep form on transaction detail (tpl-8 fields) | worker | completed |
| H4 | Verify ALERT_EMAIL / Resend on Vercel | orchestrator | completed |
| H5 | Commit + open PR for template work | orchestrator | completed |

## Recent Outcomes (last 10)
| Date | Task | Status | Result |
|------|------|--------|--------|
| 2026-08-09 | H1 cleanup duplicates | success | Removed 3 `* 2.*` files |
| 2026-08-09 | H2 template tests | success | 6/6 pass via `npm test` |
| 2026-08-09 | H3 closing prep form | success | Form + API on txn detail |
| 2026-08-09 | H4 Vercel env check | success | ALERT_EMAIL + RESEND_API_KEY present in Production |
| 2026-08-09 | H5 commit + PR | success | https://github.com/log-wade/lc-tc-command/pull/3 |
| 2026-08-09 | Email template revisions + migrations 005/006 | success | tpl-1…9 live on Supabase |

## Learnings
- Supabase/Vercel/GitHub MCP often timeout; prefer linked Supabase CLI and `gh`/`vercel` CLI as fallback
- Template ID remaps must be gated on `tpl-10` existence for greenfield safety
- Include file paths + `npx tsc --noEmit` in implementer prompts
- `vercel env ls` (no `--environment`) works on CLI v54; MCP auth still useful for dashboard tools
