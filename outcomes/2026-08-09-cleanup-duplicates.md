# H1: Cleanup accidental duplicate files

**Date:** 2026-08-09

## Status

Complete

## Result

Confirmed non-`" 2"` originals exist, then deleted three untracked accidental copies. No imports referenced the duplicate paths. Originals left untouched.

| Deleted (duplicate) | Original retained |
|---|---|
| `src/components/brand/brand-mark 2.tsx` | `src/components/brand/brand-mark.tsx` |
| `src/components/brand/login-hero 2.tsx` | `src/components/brand/login-hero.tsx` |
| `src/lib/site-url 2.ts` | `src/lib/site-url.ts` |

Post-cleanup directory listings:

- `src/components/brand/`: `brand-mark.tsx`, `login-hero.tsx` only
- `src/lib/`: `site-url.ts` only (no `site-url 2.ts`)

`rg 'brand-mark 2|login-hero 2|site-url 2'` returned no matches.

## Artifacts

- Deleted: `src/components/brand/brand-mark 2.tsx`
- Deleted: `src/components/brand/login-hero 2.tsx`
- Deleted: `src/lib/site-url 2.ts`
- Outcome log: `outcomes/2026-08-09-cleanup-duplicates.md`

## Suggested Follow-ups

- None required for this cleanup.
- Optional: add a pre-commit or CI check that fails on filenames containing ` 2.` (Finder/macOS duplicate pattern) if this recurs.
