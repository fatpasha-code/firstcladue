---
phase: 02-core-pipeline
plan: 01
subsystem: data-layer-ai-pipeline
tags: [database, migration, ai, extraction, interpretation, zod, anthropic-sdk]
dependency_graph:
  requires: [01-01, 01-02]
  provides: [records-table, extraction-pipeline, interpretation-pipeline, zod-schemas]
  affects: [02-02]
tech_stack:
  added: ["@anthropic-ai/sdk@0.80.0", "zod@4.3.6"]
  patterns: [structured-outputs, zodOutputFormat, messages.parse]
key_files:
  created:
    - supabase/migrations/20260325200000_create_records.sql
    - src/lib/ai/schemas.ts
    - src/lib/ai/extraction.ts
    - src/lib/ai/interpretation.ts
    - vercel.json
    - supabase/config.toml
    - src/components/ui/textarea.tsx
  modified:
    - package.json
    - package-lock.json
    - .env.example
decisions:
  - "Zod v4 compatible with Anthropic SDK zodOutputFormat -- verified at runtime"
  - "Separate RLS policies for SELECT/INSERT/UPDATE per research pitfall 6"
  - "Anthropic client instantiated without explicit apiKey (SDK reads ANTHROPIC_API_KEY from env automatically)"
metrics:
  duration: "3m 31s"
  completed: "2026-03-25"
  tasks: 2
  files_created: 7
  files_modified: 3
---

# Phase 02 Plan 01: Data Layer & AI Pipeline Summary

Records table migration with RLS, Zod schemas for extraction/interpretation JSON contracts, and Anthropic SDK pipeline modules using structured outputs with zodOutputFormat.

## Tasks Completed

| Task | Name | Commit | Key Files |
|------|------|--------|-----------|
| 1 | Install dependencies, init Supabase, create records migration | 47125ef | package.json, supabase/migrations/20260325200000_create_records.sql, vercel.json, .env.example, src/components/ui/textarea.tsx |
| 2 | Create Zod schemas and AI pipeline modules | 41ba20c | src/lib/ai/schemas.ts, src/lib/ai/extraction.ts, src/lib/ai/interpretation.ts |

## What Was Built

### Database Migration (records table)
- Full `records` table with all columns from TECH_SPEC.md: id, user_id, source_type, raw_text, label, status, extracted_data, user_corrections, interpretation, error_message, reviewed_at, created_at, updated_at
- Status check constraint: pending/processing/completed/failed
- RLS enabled with separate policies for SELECT, INSERT (WITH CHECK), UPDATE
- Index on (user_id, created_at DESC) for history queries
- Rollback plan documented as DOWN comment

### Zod Schemas (src/lib/ai/schemas.ts)
- `ExtractedDataSchema` -- done, in_progress, blockers, assignments, deadlines with type: explicit|inferred
- `InterpretationSchema` -- summary, management_view, hidden_blockers, ambiguities, clarification_questions, real_status: green|yellow|red
- TypeScript types exported: `ExtractedData`, `Interpretation`

### AI Pipeline Modules
- `runExtraction(rawText)` -- calls Claude via `messages.parse()` with `zodOutputFormat(ExtractedDataSchema)`, Russian-only system prompt
- `runInterpretation(rawText, extractedData)` -- calls Claude via `messages.parse()` with `zodOutputFormat(InterpretationSchema)`, Russian-only system prompt
- Models from env vars (CLAUDE_EXTRACTION_MODEL, CLAUDE_INTERPRETATION_MODEL), fail explicitly if not set
- Error handling: try/catch with console.error, re-throw, no user data logging

### Infrastructure
- `vercel.json` with maxDuration: 60 for Server Action timeout
- `.env.example` updated with ANTHROPIC_API_KEY, CLAUDE_EXTRACTION_MODEL, CLAUDE_INTERPRETATION_MODEL
- Supabase local directory initialized
- shadcn Textarea component installed

## Decisions Made

1. **Zod v4 + Anthropic SDK compatibility**: Verified at runtime that `zodOutputFormat()` correctly generates JSON schema from Zod v4 objects. No compatibility issues.
2. **Separate RLS policies**: Used separate SELECT/INSERT/UPDATE policies instead of a single FOR ALL policy, per research pitfall 6 -- INSERT requires WITH CHECK, not USING.
3. **SDK auto-reads ANTHROPIC_API_KEY**: Anthropic client instantiated without explicit apiKey parameter; the SDK reads from process.env.ANTHROPIC_API_KEY automatically.

## Deviations from Plan

None -- plan executed exactly as written.

## Verification Results

- `npm run build` -- PASS (no TypeScript errors, all routes compile)
- `npx tsc --noEmit` -- PASS (no errors in source files; node_modules library declaration warnings are irrelevant with skipLibCheck)
- Dependency versions exact (no ^ prefix): @anthropic-ai/sdk@0.80.0, zod@4.3.6
- Migration file contains CREATE TABLE, RLS, INSERT WITH CHECK, index, DOWN comment
- Both AI modules use `messages.parse()` with `zodOutputFormat()`, models from env vars
- System prompts contain Russian-only instruction in both files

## Known Stubs

None -- all modules are fully implemented with real logic.

## Self-Check: PASSED

- All 6 created files exist on disk
- Both commit hashes (47125ef, 41ba20c) found in git log
