# Phase 2: Core Pipeline - Context

**Gathered:** 2026-03-25
**Status:** Ready for planning

<domain>
## Phase Boundary

User pastes text → Claude runs extraction + interpretation → result saved to DB and shown inline.
This is the core value of the product delivered end-to-end: raw text in, structured management picture out.

The home page `/` transforms from a placeholder into the main working surface.
</domain>

<decisions>
## Implementation Decisions

### Post-Submit Navigation
- **D-01:** After analysis completes, stay on `/` — show inline result below the form (summary + real_status). Form clears, result visible immediately. Link to full record ("открыть запись") points to `/records/[id]` — Phase 3 will flesh that out.

### Loading Experience
- **D-02:** Show staged status messages during analysis (not just a spinner):
  - "Сохраняем запись..."
  - "Извлекаем данные..."
  - "Интерпретируем..."
  - "Готово"
  Analysis takes 15-20 seconds — staged progress makes the wait feel shorter. Implemented as useState with status text.

### Output Language
- **D-03:** Extraction and interpretation output must always be in Russian. Prompt must explicitly require Russian output. Texts will always be Russian; consistent output language is required.

### Input Character Limit
- **D-04:** Maximum input size is 50 000 characters. This is a ceiling — user typically pastes less. Covers large meetings, long threads, combined notes.

### Claude's Discretion
- Specific Claude model selection (haiku for extraction, sonnet for interpretation — or adjust based on quality testing)
- Exact prompt wording — must require Russian output and produce valid JSON
- Server Action structure (`createRecord`) — save → extract → interpret sequence
- DB migration details (column types, indexes) — follow TECH_SPEC.md schema exactly
- shadcn/ui components for the input form (Textarea, Button, Card, Label)
- Design references: 21st.dev (UI patterns), uibits.co (visual inspiration)

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Project Spec
- `TECH_SPEC.md` §Module 2: Input & Ingestion — textarea, validation, character limits
- `TECH_SPEC.md` §Module 3: Extraction — Claude API call, JSON schema for `extracted_data`
- `TECH_SPEC.md` §Module 4: Interpretation — Claude API call, JSON schema for `interpretation`
- `TECH_SPEC.md` §Database Schema — `records` table columns, types, RLS
- `CLAUDE.md` — Stack, agent rules, API conventions
- `.claude/rules/api.md` — Server Action patterns, error handling, status codes
- `.claude/rules/database.md` — Migration format, RLS requirements

### Requirements
- `REQUIREMENTS.md` — INGEST-01, INGEST-02, INGEST-03, INGEST-04, EXTRACT-01, EXTRACT-02, INTERP-01

### Roadmap
- `.planning/ROADMAP.md` §Phase 2 — Plans breakdown and done criteria

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/lib/supabase/server.ts` — server Supabase client (use in Server Actions)
- `src/components/ui/button.tsx`, `card.tsx`, `input.tsx`, `label.tsx`, `alert.tsx` — shadcn/ui components available
- `src/app/actions.ts` — pattern for Server Actions (use server, createClient, redirect)
- `src/app/page.tsx` — home page to be replaced with input form

### Established Patterns
- Server Actions: `'use server'`, `createClient()`, try/catch, return `{ error }` on failure
- Forms: `use client` component with `useState` for loading/error, Server Action as handler
- Error display: inline below form (not toast, not modal) — from Phase 1 D-04

### Integration Points
- Home page `/` becomes the main input surface — `src/app/page.tsx` will be rewritten
- New Server Action `createRecord` in `src/app/actions.ts` or new `src/app/records/actions.ts`
- DB migration needed before Server Action can write to `records` table

</code_context>

<specifics>
## Specific Ideas

- Staged loading messages in Russian: "Сохраняем запись...", "Извлекаем данные...", "Интерпретируем...", "Готово"
- Inline result after submit: show `interpretation.summary` + `interpretation.real_status` badge
- "Открыть запись →" link to `/records/[id]` after result shown

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 02-core-pipeline*
*Context gathered: 2026-03-25*
