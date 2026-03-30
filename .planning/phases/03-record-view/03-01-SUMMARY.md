---
phase: 03-record-view
plan: 01
subsystem: frontend
tags: [record-view, tabs, extraction, interpretation, shadcn]
dependency_graph:
  requires: [supabase records table, ExtractedDataSchema, InterpretationSchema, StatusBadge]
  provides: [/records/[id] page, ExtractionTab, InterpretationTab, EvidenceCollapsible, ImpactBadge, InferredBadge, RecordHeader]
  affects: [home page navigation, records history link targets]
tech_stack:
  added: [shadcn tabs, shadcn collapsible, shadcn skeleton, shadcn badge, @base-ui/react/tabs, @base-ui/react/collapsible]
  patterns: [Server Component page with client tab components, 4-state pattern on page, try/catch schema parsing]
key_files:
  created:
    - src/app/records/[id]/page.tsx
    - src/app/records/[id]/loading.tsx
    - src/app/records/[id]/not-found.tsx
    - src/components/record/record-header.tsx
    - src/components/record/extraction-tab.tsx
    - src/components/record/interpretation-tab.tsx
    - src/components/record/evidence-collapsible.tsx
    - src/components/record/impact-badge.tsx
    - src/components/record/inferred-badge.tsx
    - src/components/ui/tabs.tsx
    - src/components/ui/collapsible.tsx
    - src/components/ui/skeleton.tsx
    - src/components/ui/badge.tsx
  modified: []
decisions:
  - "Tabs use base-nova preset (@base-ui/react/tabs) — not radix — as installed by shadcn@latest with base-nova style"
  - "ExtractionTab handles all 5 extraction categories in a single client component with a tab prop discriminant"
  - "Schema parse failures render graceful error state rather than crashing the page"
metrics:
  duration_minutes: 4
  completed_date: "2026-03-30"
  tasks_completed: 3
  tasks_total: 3
  files_created: 13
  files_modified: 0
---

# Phase 3 Plan 01: Record View Page Summary

**One-liner:** Read-only /records/[id] page with 6 tabs (5 extraction categories + interpretation), domain-specific formatting (impact badges, inferred deadline badges, evidence collapsibles), and graceful error states.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Install shadcn components and create page route scaffold | f90789c | tabs.tsx, collapsible.tsx, skeleton.tsx, badge.tsx, page.tsx, loading.tsx, not-found.tsx, record-header.tsx, impact-badge.tsx, inferred-badge.tsx |
| 2 | Build extraction tabs with domain-specific rendering | 377fdae | extraction-tab.tsx, page.tsx (updated) |
| 3 | Build interpretation tab with evidence collapsibles | 0751701 | evidence-collapsible.tsx, interpretation-tab.tsx, page.tsx (updated) |

## What Was Built

The primary consumption interface for analysis results. Users navigate to `/records/[id]` and see:

- **RecordHeader**: back link, title (label or "Запись от {date}"), StatusBadge if interpretation available
- **6 tabs**: Сделано, В работе, Блокеры, Назначения, Дедлайны, Интерпретация
- **ExtractionTab**: handles all 5 extraction categories with domain formatting:
  - Done: description + optional person
  - In Progress: description + optional person + optional deadline with Calendar icon
  - Blockers: ImpactBadge (colored red/amber/neutral) + description
  - Assignments: grouped by person with task list + optional by_when
  - Deadlines: date + InferredBadge if type=inferred + description + optional condition
- **InterpretationTab**: 6 blocks in D-08 order (Статус, Резюме, Управленческий взгляд, Скрытые блокеры, Неясности, Что уточнить)
- **EvidenceCollapsible**: claim text with expandable "источник" section showing evidence quote and optional speaker
- **Loading state**: Skeleton layout via loading.tsx
- **Not found state**: Alert "Запись не найдена." with back link
- **Empty tab state**: "Ничего не найдено" for any empty array (all tabs)

## Key Technical Decisions

1. **base-nova preset tabs**: shadcn@latest with base-nova style installs `@base-ui/react/tabs` (not radix-ui). The exported API (Tabs, TabsList, TabsTrigger, TabsContent) is identical to radix, so usage is the same.

2. **ExtractionTab as single component**: All 5 extraction categories handled in one client component via a `tab` discriminant prop — avoids 5 separate files while keeping clear separation.

3. **Schema parsing with graceful fallback**: `ExtractedDataSchema.parse()` and `InterpretationSchema.parse()` are wrapped in try/catch. Extraction parse failure shows inline error. Interpretation parse failure silently sets interpretation=null and renders "Интерпретация недоступна".

4. **user_corrections priority**: `record.user_corrections ?? record.extracted_data` — when user has corrected data, the corrected version is used for display.

## Deviations from Plan

None - plan executed exactly as written.

## Known Stubs

None — all data flows from Supabase to rendered components. No hardcoded empty values or placeholder text that affect functionality.

## Self-Check: PASSED
