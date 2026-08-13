# Coordination Source Document Reconciliation

## Scope

Reviewed all six files in `Downloads/Listing Coordination`, both files in
`Downloads/Transaction Coordination`, and prior project decisions recovered from
the listing-template, email-revision, system-design, and deadline-update chats.

## Implemented

- Corrected transaction deadline counting, Central-time calendar handling,
  banking-holiday extensions, option-period handling, CD/DA dates, and removed
  the non-contractual loan-application deadline.
- Added editable transaction contract terms and safe recomputation.
- Preserved only met/waived deadline history; legacy survey terms must be
  confirmed before recomputation.
- Made database deadline replacement atomic through
  `replace_transaction_deadlines`.
- Expanded listing intake for ECAD screening, survey/T-47, seller contact
  details, staging/disclosure/key status, and photoshoot scheduling.
- Added ECAD and listing-documents/T-47 templates and review-queue branches.
- Added editable listing make-ready/document tracking.
- Queued photoshoot confirmations when a complete schedule is entered, with
  instant-normalized deduplication.
- Added reverse prospecting, online views, and online saves to weekly stats.

## Deliberately retained

- Explicit user decisions override sample-email conventions: performance dates
  roll past weekends/holidays, option end is not extended, CD is three business
  days before closing, and survey days remain contract-editable.
- No additional `tpl-2` copy was invented while its voice-memo input remains
  outstanding.

## Verification

- `npx tsc --noEmit`
- `TZ=UTC npm test` — 33 passing
- ESLint on all changed workflow files
- `git diff --check`
- `npm run build`
- Independent code-review pass approved after follow-up fixes
