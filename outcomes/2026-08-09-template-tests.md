# Task H2: Automated email template regression tests

## Status
Done

## Result
Added `node:test` regression coverage for Carly email template revisions in `src/lib/templates/catalog.ts`. Wired `npm test` via `tsx --test` (no prior test runner in the repo). All 6 tests pass; `npx tsc --noEmit` passes.

Coverage locked in:
- Contiguous `tpl-1` … `tpl-9` only (no `tpl-10` in `EMAIL_TEMPLATES`)
- Forbidden placeholders absent from subjects/bodies (`photographer_name`, `lockbox_serial`, `go_live_time`, `agent_read`, `next_steps`; `week_date` in subjects)
- `tpl-1` body: "I'm Carly", "9 to 5", no "Bryant"
- `tpl-5`: `{{key_dates_table}}`, no "Intro emails to lender"
- `tpl-6`: "Do Kind Group"
- `getTemplateById("tpl-10")` → legacy alias resolves to `tpl-9`

## Artifacts
- `src/lib/templates/catalog.test.ts`
- `package.json` — `"test": "tsx --test src/lib/templates/catalog.test.ts"`, `tsx` added as `devDependency`
- Commands: `npm test` (6 pass / 0 fail); `npx tsc --noEmit` (clean)

## Suggested Follow-ups
- Expand coverage to helper modules (`build-context`, `deadline-table`, `progress`, `signature`) if those strings are also revision-sensitive.
- Optionally silence ESM package-type warnings later by adding `"type": "module"` only if the Next.js app setup remains compatible.
- Add CI step running `npm test` + `npx tsc --noEmit` on PRs.
