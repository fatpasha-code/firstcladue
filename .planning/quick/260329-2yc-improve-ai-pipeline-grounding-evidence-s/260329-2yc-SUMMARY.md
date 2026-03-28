---
phase: quick
plan: 260329-2yc
subsystem: ai-pipeline
tags: [extraction, interpretation, schemas, grounding, evidence]
dependency_graph:
  requires: []
  provides: [EvidenceSchema, GroundedClaimSchema, qualifier-handling, coverage-rule, grounding-first-generation]
  affects: [src/lib/ai/schemas.ts, src/lib/ai/extraction.ts, src/lib/ai/interpretation.ts]
tech_stack:
  added: []
  patterns: [grounding-first generation, evidence-backed claims]
key_files:
  created: []
  modified:
    - src/lib/ai/schemas.ts
    - src/lib/ai/extraction.ts
    - src/lib/ai/interpretation.ts
decisions:
  - EvidenceSchema uses confidence enum ['high', 'medium'] — 'low' excluded because a low-confidence item should not be included at all
  - real_status_reason placed after real_status in schema to match JSON field ordering in prompt
metrics:
  duration_min: 10
  completed_date: "2026-03-29"
  tasks_completed: 4
  files_modified: 3
---

# Phase quick Plan 260329-2yc: Improve AI Pipeline Grounding and Evidence Summary

## One-liner

Added EvidenceSchema + GroundedClaimSchema to make hidden_blockers and ambiguities verifiable with grounded evidence, plus qualifier-handling and full-coverage rules in extraction, and a grounding-first generation rule in interpretation.

## What Was Changed Per File

### src/lib/ai/schemas.ts

- Added `EvidenceSchema`: `{ type: 'quote'|'paraphrase', text: string, speaker?: string, confidence: 'high'|'medium' }`
- Added `GroundedClaimSchema`: `{ claim: string, evidence: EvidenceSchema }`
- Changed `hidden_blockers` in `InterpretationSchema` from `z.array(z.string())` to `z.array(GroundedClaimSchema)`
- Changed `ambiguities` in `InterpretationSchema` from `z.array(z.string())` to `z.array(GroundedClaimSchema)`
- Added `real_status_reason: z.string()` field to `InterpretationSchema`
- Exported new types: `Evidence`, `GroundedClaim`
- `clarification_questions` kept as `z.array(z.string())` — no change
- `ExtractedData` and `Interpretation` types regenerate automatically from updated schemas

### src/lib/ai/extraction.ts

Added two rules to the system prompt (before the JSON format spec):

**QUALIFIER RULE:** If an item is completed but the speaker added a qualifier signaling it is not final or stable (e.g. "но не финальная", "пока сырой", "не считаю финальным", "нужно доделать", "временно", "грубо", "на скорую руку") — classify as `in_progress`, not `done`. Only classify as `done` when the speaker treats the item as fully resolved with no caveats.

**COVERAGE RULE:** Identify all thematic blocks (backend, frontend, analytics, infrastructure, team, finances, product). Extract at least one item per block if the block has actionable or status information. Do not silently skip topics with done/in_progress/blocker/assignment/deadline info.

No changes to JSON output format, model selection, or API call logic.

### src/lib/ai/interpretation.ts

Three changes to the system prompt:

**Change 1 — Grounding-first generation rule (replaces post-hoc prohibition):**
Replaced "не придумывай блокеры" style prohibition with a positive two-step process:
1. Find the specific text fragment supporting the claim first
2. Write the claim after identifying the evidence
Items without grounding in raw text are forbidden — including plausible/likely ones.

**Change 2 — Updated JSON format block:**
`hidden_blockers` and `ambiguities` now show the `GroundedClaimSchema` shape in the prompt's example JSON: `{ claim: "...", evidence: { type, text, speaker?, confidence } }`

**Change 3 — real_status_reason instruction:**
Added instruction: one sentence stating the primary reason for the chosen status, referencing a specific fact from the conversation. Required — do not omit.

No changes to model selection, API logic, or how `summary`/`management_view` are generated.

### src/components/analyze-form.tsx

No changes made. Task 4 was a no-op — the file only renders `real_status` (unchanged enum) and `summary` (unchanged string). TypeScript confirmed zero errors against the updated `Interpretation` type.

## New Schema Shape

```typescript
export const EvidenceSchema = z.object({
  type: z.enum(['quote', 'paraphrase']),
  text: z.string().min(1),
  speaker: z.string().optional(),
  confidence: z.enum(['high', 'medium'])
})

export const GroundedClaimSchema = z.object({
  claim: z.string(),
  evidence: EvidenceSchema
})

// InterpretationSchema changes:
// hidden_blockers: z.array(GroundedClaimSchema)   ← was z.array(z.string())
// ambiguities: z.array(GroundedClaimSchema)        ← was z.array(z.string())
// real_status_reason: z.string()                   ← new field
```

## Key Prompt Rules Added

| Rule | File | Purpose |
|------|------|---------|
| QUALIFIER RULE | extraction.ts | Qualified-done items → in_progress, not done |
| COVERAGE RULE | extraction.ts | No silent topic drops; all thematic blocks covered |
| GROUNDING RULE | interpretation.ts | Find evidence first, then write claim; no plausible-but-ungrounded items |
| real_status_reason | interpretation.ts | Required one-sentence explanation with specific fact from conversation |

## Deviations from Plan

None — plan executed exactly as written. Task 4 confirmed as no-op as predicted.

## Commits

| Hash | Task | Description |
|------|------|-------------|
| 197731b | Task 1 | Add EvidenceSchema, GroundedClaimSchema; update InterpretationSchema |
| 0f1a143 | Task 2 | Add qualifier-handling and full-coverage rules to extraction prompt |
| d901097 | Task 3 | Add grounding-first rule, evidence schema in prompt, real_status_reason |

## Known Stubs

None — all schema fields are structural changes to the AI pipeline. The JSONB column in Supabase stores whatever the app saves, so no migration needed.

## Self-Check: PASSED
