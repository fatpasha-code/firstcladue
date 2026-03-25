# Roadmap: Update Tracker v1

**Created:** 2026-03-25
**Milestone:** v1 MVP — Internal tool for Pavel

---

## Phase 1: Foundation

**Goal:** Project scaffolded, auth working, protected routes in place. Nothing else builds without this.

**Covers:** AUTH-01, AUTH-02, AUTH-03

**Plans:** 2/2 plans complete

Plans:
- [x] 01-01-PLAN.md — Scaffold Next.js project + Supabase client utilities + auth middleware (2026-03-25)
- [x] 01-02-PLAN.md — Auth UI: login page, password reset flow, sign out, protected home page

**Done when:**
- [ ] `npm run dev` runs without errors
- [ ] `/login` page renders and accepts credentials
- [ ] Authenticated user lands on `/`
- [ ] Unauthenticated request to `/` redirects to `/login`
- [ ] `.env.example` has all required vars

---

## Phase 2: Core Pipeline

**Goal:** User pastes text → Claude runs extraction + interpretation → result saved to DB. The core value delivered end-to-end.

**Covers:** INGEST-01–04, EXTRACT-01–02, INTERP-01

### Plans

1. **Database migration** — `records` table (full schema from TECH_SPEC.md), RLS policy, index
2. **Input form** — `/` page: Textarea + label field + "Analyze" button, validation, loading state
3. **Extraction pipeline** — `createRecord` Server Action: save record, run Claude extraction (sync), save `extracted_data`
4. **Interpretation pipeline** — run Claude interpretation after extraction, save `interpretation` to same record

**Done when:**
- [ ] User can paste text and submit
- [ ] Record created in DB with status `completed`
- [ ] `extracted_data` populated with done/blockers/deadlines/assignments
- [ ] `interpretation` populated with summary/real_status/hidden_blockers/questions
- [ ] Inferred deadlines marked with `"type": "inferred"`
- [ ] Errors surface with status `failed` + `error_message`

---

## Phase 3: Record View

**Goal:** User can see and edit the results of analysis. Full record page with structured tabs.

**Covers:** EXTRACT-03–04, INTERP-02–03

### Plans

1. **Record page scaffold** — `/records/[id]` with tab navigation (Сделано / В работе / Блокеры / Назначения / Дедлайны / Интерпретация)
2. **Extraction tabs** — render `extracted_data` per tab; inferred deadlines marked visually
3. **Interpretation tab** — summary, management_view, hidden_blockers, ambiguities, clarification_questions, real_status badge (green/yellow/red)
4. **Inline editing** — edit extracted fields, save `user_corrections` via PATCH

**Done when:**
- [ ] All 6 tabs render correct data
- [ ] Inferred deadlines visually distinguished
- [ ] real_status shows as colored badge
- [ ] User can edit a field and save — corrections persisted without overwriting original

---

## Phase 4: History & Review

**Goal:** User can browse all past records, mark as reviewed, select for report generation.

**Covers:** HIST-01–04

### Plans

1. **History page** — `/history`: list of records (date, label, status, reviewed indicator), pagination or scroll
2. **Reviewed state** — PATCH endpoint to mark reviewed, UI reflects state
3. **Multi-select for reports** — checkboxes on history cards, "Generate Report" CTA becomes active when ≥1 selected

**Done when:**
- [ ] `/history` shows all records sorted by date
- [ ] Click on record → `/records/[id]`
- [ ] "Mark reviewed" works and persists
- [ ] Selecting records enables "Generate Report" action

---

## Phase 5: Reports

**Goal:** User can generate weekly/monthly/follow-up reports from selected records and copy the result.

**Covers:** REPORT-01–05

### Plans

1. **Database migration** — `reports` table (schema from TECH_SPEC.md), RLS, index
2. **Report generation** — `generateReport` Server Action: read selected records' `extracted_data`, call Claude, save markdown to `reports`
3. **Report pages** — `/reports`: list; `/reports/[id]`: rendered markdown + Copy button

**Done when:**
- [ ] User can select records in `/history` and click "Generate Report"
- [ ] Report type (weekly / monthly / follow-up) selectable
- [ ] Generated report saved and navigable
- [ ] Markdown rendered correctly
- [ ] Copy button copies plain text to clipboard

---

## Summary

| Phase | Focus | Requirements |
|-------|-------|-------------|
| 1 | Foundation | AUTH-01–03 |
| 2 | Core Pipeline | INGEST-01–04, EXTRACT-01–02, INTERP-01 |
| 3 | Record View | EXTRACT-03–04, INTERP-02–03 |
| 4 | History & Review | HIST-01–04 |
| 5 | Reports | REPORT-01–05 |

**Total:** 23 v1 requirements across 5 phases

---
*Created: 2026-03-25*
