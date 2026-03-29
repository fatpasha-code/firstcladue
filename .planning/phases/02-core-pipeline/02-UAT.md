---
status: complete
phase: 02-core-pipeline
source: [02-01-SUMMARY.md, 02-02-SUMMARY.md]
started: 2026-03-29T20:00:00Z
updated: 2026-03-29T21:00:00Z
---

## Current Test

[testing complete]

## Tests

### 1. Cold Start Smoke Test
expected: Kill any running dev server. Start fresh with `npm run dev`. Server boots without errors, migration complete, homepage loads and returns live data (form visible, no crash).
result: pass

### 2. Home page shows AnalyzeForm
expected: After login, home page shows a textarea with placeholder text, character counter (0/...), and a submit button. Page is not blank.
result: pass

### 3. Character counter
expected: Typing text into the textarea updates the counter in real time (e.g. "42 / 50 000"). Counter uses Russian number formatting (spaces as thousands separator).
result: pass

### 4. Keyboard shortcut submits form
expected: With text in the textarea, pressing Cmd+Enter (Mac) or Ctrl+Enter (Windows) starts the analysis — same as clicking the button.
result: pass

### 5. Staged loading messages
expected: After submitting, the form shows sequential loading messages while the pipeline runs: first a message about saving, then extraction, then interpretation. Button is disabled during loading.
result: pass

### 6. Inline result card appears
expected: After analysis completes, a result card appears below the form showing: a summary text, a StatusBadge (green/yellow/red pill), and a link to the record page (/records/[id]).
result: issue
reported: "Карточка появляется, но очень долго ждать"
severity: minor

### 7. StatusBadge color and label
expected: The badge in the result card matches the interpretation's real_status — green shows "В порядке", yellow shows "Требует внимания", red shows "Критично" (or similar Russian labels). Color is visually distinct.
result: pass

### 8. End-to-end pipeline saves to DB
expected: After successful analysis, a record exists in Supabase with status=completed, extracted_data and interpretation populated. The link in the result card points to this record's id.
result: pass

## Summary

total: 8
passed: 8
issues: 1
pending: 0
skipped: 0

## Gaps

- truth: "Analysis pipeline completes in a reasonable time (perceived as fast)"
  status: failed
  reason: "User reported: Очень долго проверяет"
  severity: minor
  test: 6
  artifacts: [src/app/actions.ts, src/lib/ai/extraction.ts, src/lib/ai/interpretation.ts]
  missing: []
