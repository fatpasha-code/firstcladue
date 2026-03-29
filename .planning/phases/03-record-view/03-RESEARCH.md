# Phase 3: Record View - Research

**Researched:** 2026-03-29
**Domain:** Next.js dynamic routes, shadcn/ui tabs/collapsible, Supabase JSONB read/write, React edit-mode state management
**Confidence:** HIGH

## Summary

Phase 3 builds the `/records/[id]` page -- a read/edit view for a single analysis record. The page loads a record from Supabase (extracted_data + interpretation JSONB columns), renders it across 6 tabs with domain-specific formatting (impact badges, inferred deadline markers, evidence collapsibles), and supports a global edit mode that persists corrections to user_corrections JSONB.

The existing codebase provides strong foundations: Server Component patterns, Supabase server client, Server Actions with error handling, StatusBadge component, and all base shadcn/ui components. The main additions are: a dynamic route, 3-4 new shadcn components (Tabs, Collapsible, Skeleton, Badge), several new presentational components, and a PATCH Server Action.

**Primary recommendation:** Build as a Server Component page that fetches the record, with a client-side RecordEditProvider wrapping the tab content area. Keep the page shell (header, back link) as Server Component; tabs and edit mode as client components.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-01:** Page header: date (created_at) + label (if set) + StatusBadge (real_status) + back link to home
- **D-02:** raw_text is NOT shown on the record page
- **D-03:** 6 tabs in order: Сделано / В работе / Блокеры / Назначения / Дедлайны / Интерпретация
- **D-04:** Empty tab shows "Ничего не найдено" in muted -- never hidden
- **D-05:** Blockers: impact as colored badge (red=high, yellow=medium, gray=low)
- **D-06:** Deadlines: type=inferred marked with "выведен" badge; explicit has no badge
- **D-07:** Assignments: person as heading, tasks[] below
- **D-08:** Interpretation block order: real_status -> summary -> management_view -> hidden_blockers -> ambiguities -> clarification_questions
- **D-09:** hidden_blockers/ambiguities: claim visible, evidence collapsed behind "источник" link
- **D-10:** Single "Редактировать" button toggles edit mode for entire page
- **D-11:** Editable fields: all text (description, person, deadline/by_when). Enums (impact, explicit/inferred) are read-only
- **D-12:** Single "Сохранить" saves ALL changes across ALL tabs as one PATCH to user_corrections
- **D-13:** "Отмена" discards all unsaved changes. No auto-save
- **D-14:** user_corrections stores full snapshot of corrected extracted_data (not a diff)

### Claude's Discretion
- Specific shadcn/ui components for tabs (Tabs component -- radix-based)
- Date format in header (absolute vs relative -- UI-SPEC decided: absolute Russian locale)
- Exact "Ничего не найдено" wording per tab
- Hover/focus details in edit mode
- Skeleton loading for page load

### Deferred Ideas (OUT OF SCOPE)
- Drag-and-drop between statuses (different data model, separate phase)
- Pipeline speed optimization (001-pipeline-speed-haiku -- unrelated to record view)
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| EXTRACT-03 | User can view extracted data in structured tabs | Dynamic route page + Tabs component + per-tab rendering components with correct data mapping from ExtractedDataSchema |
| EXTRACT-04 | User can edit extracted data inline | Edit mode toggle (RecordEditProvider context), Input/Textarea fields replacing static text, PATCH Server Action saving user_corrections JSONB |
| INTERP-02 | User can view interpretation in a dedicated tab on the record page | InterpretationTab component rendering all interpretation fields in D-08 order, EvidenceCollapsible for grounded claims |
| INTERP-03 | real_status is clearly and visibly communicated to the user | StatusBadge (existing) in page header + interpretation tab, colored per green/yellow/red with Russian labels |
</phase_requirements>

## Standard Stack

### Core (already installed)

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| next | 16.2.1 | App Router, dynamic routes, Server Components | Project stack |
| react | 19.1.0 | UI rendering, state management for edit mode | Project stack |
| @supabase/ssr | 0.9.0 | Server-side Supabase client | Project stack |
| zod | 4.3.6 | Schema validation for PATCH payload | Already used for AI schemas |
| lucide-react | 1.6.0 | Icons (ChevronDown for collapsible, Calendar for deadlines, ArrowLeft for back) | Already installed |

### To Install (shadcn components)

| Component | Install Command | Purpose |
|-----------|----------------|---------|
| Tabs | `npx shadcn@latest add tabs` | 6-tab navigation (radix-based, keyboard accessible) |
| Collapsible | `npx shadcn@latest add collapsible` | Evidence expand/collapse in interpretation tab |
| Skeleton | `npx shadcn@latest add skeleton` | Loading state for page |
| Badge | `npx shadcn@latest add badge` | Impact badges, inferred deadline badge |

No new npm packages needed -- shadcn components are code-generated into `src/components/ui/`.

## Architecture Patterns

### Recommended File Structure
```
src/app/records/[id]/
  page.tsx                    # Server Component: auth check, fetch record, render shell
  loading.tsx                 # Next.js loading UI (Skeleton)
  not-found.tsx               # Next.js not-found UI

src/components/record/
  record-header.tsx           # Server Component: date + label + StatusBadge + back link
  record-tabs.tsx             # Client Component: Tabs wrapper + edit mode provider
  extraction-tab.tsx          # Client Component: renders items for done/in_progress/blockers/assignments/deadlines
  interpretation-tab.tsx      # Client Component: renders interpretation blocks
  evidence-collapsible.tsx    # Client Component: claim + expandable evidence
  impact-badge.tsx            # Server or shared: colored badge for blocker impact
  inferred-badge.tsx          # Server or shared: "выведен" badge
  edit-provider.tsx           # Client Component: React Context for edit mode state
```

### Pattern 1: Server Component Page with Client Islands

**What:** Page component is async Server Component that fetches data. Interactive parts (tabs, edit mode) are client components receiving data as props.
**When to use:** Always for data-loading pages in this project.

```typescript
// src/app/records/[id]/page.tsx
import { createClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import { RecordHeader } from '@/components/record/record-header'
import { RecordTabs } from '@/components/record/record-tabs'

export default async function RecordPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: record, error } = await supabase
    .from('records')
    .select('id, label, status, extracted_data, user_corrections, interpretation, created_at')
    .eq('id', id)
    .single()

  if (error || !record) notFound()

  return (
    <div className="mx-auto max-w-4xl px-8 py-8">
      <RecordHeader record={record} />
      <RecordTabs record={record} />
    </div>
  )
}
```

**Key detail for Next.js 16:** The `params` prop is a Promise and must be awaited. This is a breaking change from Next.js 14/15.

### Pattern 2: Edit Mode via React Context

**What:** A React Context provider wraps the tab area, holding: `isEditing` boolean, `editedData` (copy of extracted_data), and setter functions. All tabs read from this context.
**When to use:** When a single toggle affects multiple sibling components across tabs.

```typescript
// edit-provider.tsx
'use client'
import { createContext, useContext, useState, useCallback } from 'react'
import type { ExtractedData } from '@/lib/ai/schemas'

type EditContextType = {
  isEditing: boolean
  editedData: ExtractedData
  setEditedData: (data: ExtractedData) => void
  startEditing: () => void
  cancelEditing: () => void
}

const EditContext = createContext<EditContextType | null>(null)
export const useEditMode = () => useContext(EditContext)!
```

### Pattern 3: user_corrections as Full Snapshot (D-14)

**What:** When saving, the entire edited extracted_data is stored in `user_corrections` JSONB column. The original `extracted_data` is never modified.
**Why:** Simplifies diffing, rollback, and display. To show current data: `user_corrections ?? extracted_data`.

```typescript
// Server Action for PATCH
export async function saveCorrections(
  recordId: string,
  corrections: ExtractedData
): Promise<{ success: true } | { error: string }> {
  // validate with ExtractedDataSchema.parse(corrections)
  // update user_corrections column
}
```

### Pattern 4: Display Priority

**What:** When rendering tab data, check `user_corrections` first, fall back to `extracted_data`.
**Implementation:** Resolve once at the page level before passing to components.

```typescript
const displayData: ExtractedData = record.user_corrections ?? record.extracted_data
```

### Anti-Patterns to Avoid
- **Storing diffs in user_corrections:** D-14 explicitly says full snapshot. Diff-based storage adds merge complexity for no benefit at this scale.
- **Separate API routes per tab:** D-12 says single PATCH for all changes. Do not create per-tab save endpoints.
- **Auto-save on blur:** D-13 explicitly says no auto-save. Only save on explicit button click.
- **Modifying extracted_data column:** The original extraction must be preserved. Only user_corrections is written by the edit flow.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Tab navigation with keyboard | Custom div-based tabs | shadcn Tabs (radix) | Arrow key navigation, ARIA roles, focus management built-in |
| Collapsible sections | Custom useState toggle | shadcn Collapsible (radix) | aria-expanded, animation, keyboard support built-in |
| Date formatting in Russian | Manual month name arrays | `Intl.DateTimeFormat('ru-RU', ...)` | Native browser API, handles all edge cases |
| Loading skeletons | Custom shimmer divs | shadcn Skeleton | Consistent styling with design system |
| Badge styling | Custom span classes | shadcn Badge + variant overrides | Consistent sizing, padding, typography |

## Common Pitfalls

### Pitfall 1: Next.js 16 Params are Promises
**What goes wrong:** Using `params.id` directly without `await` causes TypeScript errors or runtime issues.
**Why it happens:** Next.js 15+ changed params/searchParams to async.
**How to avoid:** Always `const { id } = await params` at the top of the page component.
**Warning signs:** Type error "Property 'id' does not exist on type 'Promise<...>'"

### Pitfall 2: JSONB Columns Return Unknown Types
**What goes wrong:** TypeScript treats Supabase JSONB columns as `Json | null`, not typed objects.
**Why it happens:** Supabase client does not know JSONB shape.
**How to avoid:** Parse with Zod schema after fetch: `ExtractedDataSchema.parse(record.extracted_data)`. Use try/catch -- corrupted data should show error state, not crash.
**Warning signs:** `any` casts on extracted_data or interpretation fields.

### Pitfall 3: Edit State Lost on Tab Switch
**What goes wrong:** User edits a field in tab A, switches to tab B, switches back -- edits are gone.
**Why it happens:** Each tab remounts and loses local state.
**How to avoid:** Lift edited data to a Context provider above the Tabs component. All tabs read from and write to the shared context state.
**Warning signs:** Each tab component has its own useState for edited values.

### Pitfall 4: Saving Stale Data
**What goes wrong:** User opens edit mode, another process updates the record, user saves -- overwrites newer data.
**Why it happens:** No optimistic concurrency control.
**How to avoid:** For single-user MVP, this is acceptable risk. Document that future multi-user would need `updated_at` comparison. Do not over-engineer now.

### Pitfall 5: Forgetting Empty State for All Tabs
**What goes wrong:** Tab with no data shows blank card or crashes on `.map()`.
**Why it happens:** Not checking for empty arrays.
**How to avoid:** D-04 requires "Ничего не найдено" for empty tabs. Always check `array.length === 0` before mapping.
**Warning signs:** No empty state check in extraction tab components.

### Pitfall 6: Evidence Schema Mismatch
**What goes wrong:** EvidenceCollapsible expects `evidence.speaker` but field is optional.
**Why it happens:** GroundedClaimSchema has `evidence.speaker` as optional.
**How to avoid:** Conditionally render speaker only when present. Never assume all evidence fields exist.

## Code Examples

### Date Formatting (Russian Locale)
```typescript
// Source: Intl.DateTimeFormat standard API + UI-SPEC decision
function formatDate(dateStr: string): string {
  const date = new Date(dateStr)
  return new Intl.DateTimeFormat('ru-RU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(date)
}
// Output: "29 марта 2026"
```

### Impact Badge Component
```typescript
// Source: D-05 + UI-SPEC semantic colors
const impactStyles = {
  high: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
  medium: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300',
  low: 'bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400',
}
const impactLabels = { high: 'высокий', medium: 'средний', low: 'низкий' }

export function ImpactBadge({ impact }: { impact: 'high' | 'medium' | 'low' }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${impactStyles[impact]}`}>
      <span className="sr-only">Влияние: </span>
      {impactLabels[impact]}
    </span>
  )
}
```

### Server Action for Saving Corrections
```typescript
// Source: existing actions.ts pattern + D-12/D-14
'use server'
import { createClient } from '@/lib/supabase/server'
import { ExtractedDataSchema } from '@/lib/ai/schemas'

export async function saveCorrections(
  recordId: string,
  corrections: unknown
): Promise<{ success: true } | { error: string }> {
  const parsed = ExtractedDataSchema.safeParse(corrections)
  if (!parsed.success) {
    return { error: 'Некорректные данные' }
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Не авторизован' }

  try {
    const { error } = await supabase
      .from('records')
      .update({ user_corrections: parsed.data, updated_at: new Date().toISOString() })
      .eq('id', recordId)
      .eq('user_id', user.id)

    if (error) {
      console.error('[saveCorrections] error:', error)
      return { error: 'Не удалось сохранить изменения' }
    }
    return { success: true }
  } catch (error) {
    console.error('[saveCorrections] error:', error)
    return { error: 'Не удалось сохранить изменения' }
  }
}
```

### Displaying Data with Corrections Priority
```typescript
// Source: D-14 pattern
import type { ExtractedData } from '@/lib/ai/schemas'

// At page level, resolve which data to show:
const displayData: ExtractedData = record.user_corrections
  ? ExtractedDataSchema.parse(record.user_corrections)
  : ExtractedDataSchema.parse(record.extracted_data)
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `params.id` sync access | `const { id } = await params` | Next.js 15+ | Must await params in all dynamic routes |
| `pages/` router | `app/` router with Server Components | Next.js 13+ | Already using App Router |
| Custom tab state | shadcn Tabs (radix primitives) | shadcn v4 | Code-generated, not installed as dependency |

## Open Questions

1. **Redirect after analysis completion**
   - What we know: AnalyzeForm currently shows result inline with a link to `/records/[id]`
   - What's unclear: Should Phase 3 change the post-analysis flow to redirect directly to the record page?
   - Recommendation: Keep as-is (link, not redirect). Changing analyze-form is out of Phase 3 scope.

2. **Interpretation-only edits**
   - What we know: D-11 lists editable fields from extracted_data only. Interpretation fields (summary, management_view) are not mentioned.
   - What's unclear: Can interpretation text be edited?
   - Recommendation: Treat interpretation tab as read-only per D-11 (only extracted_data text fields are editable). user_corrections stores extracted_data snapshot only.

## Project Constraints (from CLAUDE.md)

- **Stack:** Next.js App Router + Tailwind + shadcn/ui (locked)
- **Server Components default:** `use client` only for interactivity
- **4-state pattern:** loading/empty/error/success for async components
- **Server Actions:** For form submissions (not raw fetch to API routes)
- **Accessibility:** ARIA labels, semantic HTML, keyboard navigation
- **Input validation:** All Server Actions validate input first
- **Error handling:** try/catch in all Server Actions, proper status codes
- **No hardcoded AI keys:** env vars only (not relevant to this phase but noted)
- **Spec-first:** Don't code without spec (CONTEXT.md + UI-SPEC serve as spec for this phase)

## Sources

### Primary (HIGH confidence)
- `src/lib/ai/schemas.ts` -- ExtractedDataSchema, InterpretationSchema, GroundedClaimSchema, EvidenceSchema (exact field names and types)
- `supabase/migrations/20260325200000_create_records.sql` -- records table schema, user_corrections JSONB column
- `src/app/actions.ts` -- established Server Action patterns (auth check, error handling, Supabase client usage)
- `src/components/status-badge.tsx` -- existing StatusBadge with exact color classes
- `package.json` -- exact versions of all dependencies (Next.js 16.2.1, React 19.1.0, shadcn 4.1.0, zod 4.3.6)
- `03-UI-SPEC.md` -- complete visual and interaction contract
- `03-CONTEXT.md` -- all locked decisions D-01 through D-14

### Secondary (MEDIUM confidence)
- Next.js 16 params-as-Promise pattern -- verified by codebase using Next.js 16.2.1
- shadcn Tabs/Collapsible/Badge/Skeleton -- standard shadcn components, install commands verified in UI-SPEC

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- all libraries already in package.json, versions verified
- Architecture: HIGH -- follows established project patterns, all schemas inspected
- Pitfalls: HIGH -- derived from actual codebase inspection (JSONB typing, params async, schema shapes)

**Research date:** 2026-03-29
**Valid until:** 2026-04-28 (stable stack, no fast-moving dependencies)
