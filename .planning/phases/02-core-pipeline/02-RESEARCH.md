# Phase 2: Core Pipeline - Research

**Researched:** 2026-03-25
**Domain:** Database migration, AI extraction/interpretation pipeline, form UI, Anthropic SDK integration
**Confidence:** HIGH

## Summary

Phase 2 delivers the core value of Update Tracker end-to-end: user pastes text, Claude extracts structured data and generates management interpretation, results are saved to the database and shown inline. This requires four distinct capabilities: (1) a Supabase migration for the `records` table, (2) a client-side input form with staged loading, (3) an extraction pipeline using Anthropic SDK with structured outputs, and (4) an interpretation pipeline that runs sequentially after extraction.

The Anthropic SDK now supports structured outputs natively (GA, no beta headers needed) with Zod integration via `messages.parse()` and `zodOutputFormat()`. This eliminates the need for JSON parsing hacks or retry logic -- the SDK guarantees schema-compliant JSON responses. The pipeline should be synchronous within a single Server Action (TECH_SPEC.md explicitly recommends this for MVP), with staged loading messages updating the client between steps.

**Primary recommendation:** Use `@anthropic-ai/sdk` with Zod schemas and `messages.parse()` for both extraction and interpretation. Keep the pipeline synchronous in a single Server Action. Use `vercel.json` `maxDuration: 60` to handle the 15-20 second total processing time on Vercel.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-01:** After analysis completes, stay on `/` -- show inline result below the form (summary + real_status). Form clears, result visible immediately. Link to full record ("Открыть запись") points to `/records/[id]` -- Phase 3 will flesh that out.
- **D-02:** Show staged status messages during analysis (not just a spinner): "Сохраняем запись...", "Извлекаем данные...", "Интерпретируем...", "Готово". Implemented as useState with status text.
- **D-03:** Extraction and interpretation output must always be in Russian. Prompt must explicitly require Russian output.
- **D-04:** Maximum input size is 50,000 characters.

### Claude's Discretion
- Specific Claude model selection (haiku for extraction, sonnet for interpretation -- or adjust based on quality testing)
- Exact prompt wording -- must require Russian output and produce valid JSON
- Server Action structure (`createRecord`) -- save -> extract -> interpret sequence
- DB migration details (column types, indexes) -- follow TECH_SPEC.md schema exactly
- shadcn/ui components for the input form (Textarea, Button, Card, Label)
- Design references: 21st.dev (UI patterns), uibits.co (visual inspiration)

### Deferred Ideas (OUT OF SCOPE)
None -- discussion stayed within phase scope.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| INGEST-01 | User can paste text into input form | AnalyzeForm component with Textarea, validated per UI-SPEC |
| INGEST-02 | System validates input: non-empty, within character limit | Client-side validation (empty check, 50K char limit) + server-side in Server Action |
| INGEST-03 | User can add optional label to a record | Input field for label, stored in `records.label` |
| INGEST-04 | User sees loading state while analysis runs | Staged loading messages via useState (D-02) |
| EXTRACT-01 | System extracts: done, in_progress, blockers, assignments, deadlines | Anthropic SDK structured outputs with Zod schema for `extracted_data` JSON |
| EXTRACT-02 | Inferred deadlines marked separately from explicit ones | `deadlines[].type: "explicit" | "inferred"` in extraction schema |
| INTERP-01 | System generates management interpretation | Anthropic SDK structured outputs for `interpretation` JSON (summary, real_status, hidden_blockers, ambiguities, clarification_questions) |
</phase_requirements>

## Project Constraints (from CLAUDE.md)

- **Stack locked:** Next.js + Supabase + Vercel -- not up for debate
- **AI models never hardcoded:** Always from env vars. Fail explicitly if env not set
- **Migrations required:** All schema changes via migration files with rollback plan
- **No code without spec:** TECH_SPEC.md is the source of truth for `records` table schema
- **Server Components by default:** `use client` only for interactivity (the form)
- **4-state pattern** for async components (loading/empty/error/success)
- **Server Actions for form submit** -- not `fetch('/api/...')`
- **Input validation first** in all Server Actions, try/catch everywhere
- **TDD for critical logic:** Tests for extraction/interpretation pipeline, not every UI component
- **Pin dependency versions:** No `^` prefix in package.json
- **.env.example must be updated** with new env vars (ANTHROPIC_API_KEY, model env vars)

## Standard Stack

### Core (to install)

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| @anthropic-ai/sdk | 0.80.0 | Claude API calls for extraction/interpretation | Official SDK, required by CLAUDE.md |
| zod | 4.3.6 | Schema definition for structured outputs | Anthropic SDK Zod integration via `zodOutputFormat()` |

### Already Installed

| Library | Version | Purpose |
|---------|---------|---------|
| next | 16.2.1 | App Router, Server Actions, Server Components |
| @supabase/ssr | 0.9.0 | Server-side Supabase client for DB operations |
| @supabase/supabase-js | 2.100.0 | Supabase client |
| shadcn | 4.1.0 | UI components (Button, Card, Input, Label, Alert installed) |
| lucide-react | 1.6.0 | Icons |

### shadcn/ui Components

| Component | Status | Action |
|-----------|--------|--------|
| Button | Installed | -- |
| Card, CardHeader, CardTitle, CardContent | Installed | -- |
| Input | Installed | -- |
| Label | Installed | -- |
| Alert | Installed | -- |
| Textarea | NOT installed | `npx shadcn add textarea` before implementation |

**Installation:**
```bash
npm install @anthropic-ai/sdk@0.80.0 zod@4.3.6
npx shadcn add textarea
```

## Architecture Patterns

### Recommended Project Structure
```
src/
  app/
    page.tsx                    # Home page (Server Component, fetches user, renders AnalyzeForm)
    actions.ts                  # signOut (existing) + createRecord Server Action
  components/
    analyze-form.tsx            # 'use client' -- form + staged loading + inline result
    status-badge.tsx            # real_status colored pill (green/yellow/red)
  lib/
    supabase/
      server.ts                 # Existing server client
    ai/
      extraction.ts             # runExtraction(text) -- Claude call + Zod parse
      interpretation.ts         # runInterpretation(text, extractedData) -- Claude call + Zod parse
      schemas.ts                # Zod schemas for extracted_data and interpretation JSON
supabase/
  migrations/
    YYYYMMDDHHMMSS_create_records.sql  # records table migration
```

### Pattern 1: Synchronous Pipeline in Server Action

**What:** Single Server Action `createRecord` that saves record, runs extraction, runs interpretation sequentially.
**When to use:** MVP single-user tool where 15-20 second response is acceptable.
**Why:** TECH_SPEC.md explicitly recommends synchronous processing for MVP. `void runAnalysis(id)` is unreliable on Vercel serverless.

```typescript
// src/app/actions.ts
'use server'

import { createClient } from '@/lib/supabase/server'
import { runExtraction } from '@/lib/ai/extraction'
import { runInterpretation } from '@/lib/ai/interpretation'

export async function createRecord(rawText: string, label?: string) {
  // 1. Validate input
  if (!rawText || rawText.trim().length === 0) {
    return { error: 'Вставьте текст для анализа' }
  }
  if (rawText.length > 50_000) {
    return { error: 'Текст превышает лимит в 50 000 символов' }
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { error: 'Не авторизован' }
  }

  try {
    // 2. Insert record with status 'pending'
    const { data: record, error: insertError } = await supabase
      .from('records')
      .insert({ user_id: user.id, raw_text: rawText, label: label || null, status: 'pending' })
      .select('id')
      .single()

    if (insertError || !record) {
      return { error: 'Не удалось сохранить запись' }
    }

    // 3. Update to 'processing', run extraction
    await supabase.from('records').update({ status: 'processing' }).eq('id', record.id)
    const extractedData = await runExtraction(rawText)

    // 4. Save extraction, run interpretation
    await supabase.from('records').update({ extracted_data: extractedData }).eq('id', record.id)
    const interpretation = await runInterpretation(rawText, extractedData)

    // 5. Save interpretation, mark completed
    await supabase.from('records').update({
      interpretation,
      status: 'completed',
      updated_at: new Date().toISOString()
    }).eq('id', record.id)

    return { id: record.id, interpretation }
  } catch (error) {
    console.error('[createRecord] error:', error)
    // If we have a record ID, mark it as failed
    return { error: 'Не удалось выполнить анализ' }
  }
}
```

### Pattern 2: Anthropic SDK Structured Outputs with Zod

**What:** Use `messages.parse()` with `zodOutputFormat()` for guaranteed valid JSON.
**When to use:** Always for extraction and interpretation -- eliminates JSON parsing errors.

```typescript
// src/lib/ai/extraction.ts
import Anthropic from '@anthropic-ai/sdk'
import { zodOutputFormat } from '@anthropic-ai/sdk/helpers/zod'
import { ExtractedDataSchema } from './schemas'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function runExtraction(rawText: string) {
  const model = process.env.CLAUDE_EXTRACTION_MODEL
  if (!model) throw new Error('CLAUDE_EXTRACTION_MODEL env var is not set')

  const response = await client.messages.parse({
    model,
    max_tokens: 4096,
    system: `Ты — аналитик, извлекающий структурированные данные из текстов рабочих созвонов и переписок. Весь вывод строго на русском языке.`,
    messages: [{ role: 'user', content: rawText }],
    output_config: { format: zodOutputFormat(ExtractedDataSchema) }
  })

  return response.parsed_output
}
```

### Pattern 3: Staged Loading via Client State

**What:** Client component updates status text as each pipeline step completes.
**When to use:** For the AnalyzeForm component, matching D-02 decision.

The key design challenge: Server Actions are a single await -- you cannot stream intermediate status updates from a Server Action. The staged loading must be driven client-side.

**Approach: Split into multiple sequential Server Action calls from the client.**

Alternatively, use a single Server Action but drive the staged messages with timers client-side (simulated progress). However, this is less honest about actual progress.

**Recommended approach: Three separate server-side functions called sequentially from the client.**

```typescript
// Client component
const [stage, setStage] = useState<string>('')

async function handleSubmit() {
  setStage('Сохраняем запись...')
  const saveResult = await saveRecord(rawText, label)
  if (saveResult.error) { setError(saveResult.error); return }

  setStage('Извлекаем данные...')
  const extractResult = await extractRecord(saveResult.id)
  if (extractResult.error) { setError(extractResult.error); return }

  setStage('Интерпретируем...')
  const interpretResult = await interpretRecord(saveResult.id)
  if (interpretResult.error) { setError(interpretResult.error); return }

  setStage('Готово')
  setResult(interpretResult)
}
```

**Trade-off analysis:** A single `createRecord` action is simpler code but cannot update the client mid-execution. Three separate actions enable real staged loading but add complexity and multiple round-trips. **Recommendation: use three separate Server Actions** (`saveRecord`, `extractRecord`, `interpretRecord`) because D-02 explicitly requires staged progress reflecting actual pipeline state, and the user decided this is important for the 15-20 second wait.

### Anti-Patterns to Avoid
- **`void runAnalysis(id)` fire-and-forget:** Unreliable on Vercel serverless -- function may terminate before completion. Use synchronous pipeline.
- **`JSON.parse()` on raw Claude response:** Use structured outputs with Zod instead. Eliminates parsing errors entirely.
- **Hardcoded model IDs:** Always read from `process.env.CLAUDE_EXTRACTION_MODEL` and `process.env.CLAUDE_INTERPRETATION_MODEL`. Fail explicitly if not set.
- **Logging user data:** Log errors and latency only, never the raw text content or AI responses.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| JSON schema validation for AI output | Custom JSON parsing + validation | `@anthropic-ai/sdk` structured outputs + Zod | Guaranteed valid JSON via constrained decoding, zero parsing errors |
| Form validation | Custom regex checks | Zod schemas (shared client/server) | Type-safe, reusable, consistent validation |
| UUID generation | `crypto.randomUUID()` in JS | `gen_random_uuid()` in PostgreSQL | DB-level generation is more reliable, avoids client-server ID mismatch |
| Status badges | Custom CSS classes | Mapped object with Tailwind classes | Consistent, type-safe color mapping from UI-SPEC |

## Common Pitfalls

### Pitfall 1: Vercel Server Action Timeout
**What goes wrong:** Server Action takes >15 seconds and times out on Vercel free tier (default 10s limit).
**Why it happens:** Two sequential Claude API calls (extraction ~5-10s + interpretation ~5-10s) plus DB operations.
**How to avoid:** Add `vercel.json` with `maxDuration: 60` for Server Action routes. For local dev, no timeout issue.
**Warning signs:** Works locally but fails on Vercel deploy.

```json
{
  "functions": {
    "app/**/*": {
      "maxDuration": 60
    }
  }
}
```

### Pitfall 2: Missing Supabase Migration Directory
**What goes wrong:** `npx supabase migration new` fails because `supabase/` directory does not exist.
**Why it happens:** Phase 1 did not initialize Supabase locally -- there is no `supabase/` directory in the project root.
**How to avoid:** Run `npx supabase init` first to create the `supabase/` directory structure, OR manually create `supabase/migrations/` directory. The Supabase CLI (v2.84.4) is available.
**Warning signs:** `ls supabase/` returns nothing.

### Pitfall 3: RLS Blocks Server Action Writes
**What goes wrong:** `supabase.from('records').insert(...)` returns empty result or error.
**Why it happens:** RLS policy `auth.uid() = user_id` requires the user to be authenticated via the Supabase client. Server-side `createClient()` from `@supabase/ssr` with cookies propagates the auth context, so this should work -- but only if the middleware is correctly forwarding cookies.
**How to avoid:** Always use the server client from `src/lib/supabase/server.ts` (already established pattern). Always include `user_id: user.id` in inserts. Test the full flow end-to-end.
**Warning signs:** Insert returns `null` with no visible error.

### Pitfall 4: Anthropic API Key Not Configured
**What goes wrong:** `Anthropic()` constructor throws or returns auth error.
**Why it happens:** `ANTHROPIC_API_KEY` not in `.env.local`.
**How to avoid:** Validate env vars at module load time. Update `.env.example` with all required vars. Fail explicitly with a clear error message.
**Warning signs:** 401 errors from Anthropic API.

### Pitfall 5: Claude Output Language Inconsistency
**What goes wrong:** Extraction or interpretation returns data partially in English.
**Why it happens:** System prompt does not firmly enough require Russian output, or the model switches to English for certain fields.
**How to avoid:** System prompt must include explicit instruction: "Весь вывод строго на русском языке. Все поля, описания и значения -- только на русском." Test with both Russian and mixed-language inputs.
**Warning signs:** `real_status` field is fine (enum), but `summary` or `description` fields come back in English.

### Pitfall 6: INSERT RLS Policy Needs Separate WITH CHECK
**What goes wrong:** SELECT-only RLS policy (`USING`) does not automatically allow INSERT.
**Why it happens:** PostgreSQL RLS `USING` clause applies to SELECT/UPDATE/DELETE but INSERT requires `WITH CHECK`.
**How to avoid:** Create the policy with both USING and WITH CHECK, or use separate policies for read and write operations.

```sql
-- Option A: Combined policy for all operations
CREATE POLICY "own_records" ON records
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Option B: Separate policies
CREATE POLICY "select_own" ON records FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "insert_own" ON records FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "update_own" ON records FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
```

## Code Examples

### Zod Schemas for Extraction and Interpretation

```typescript
// src/lib/ai/schemas.ts
import { z } from 'zod'

export const ExtractedDataSchema = z.object({
  done: z.array(z.object({
    description: z.string(),
    person: z.string().optional()
  })),
  in_progress: z.array(z.object({
    description: z.string(),
    person: z.string().optional(),
    deadline: z.string().optional()
  })),
  blockers: z.array(z.object({
    description: z.string(),
    impact: z.enum(['high', 'medium', 'low'])
  })),
  assignments: z.array(z.object({
    person: z.string(),
    tasks: z.array(z.string()),
    by_when: z.string().optional()
  })),
  deadlines: z.array(z.object({
    date: z.string(),
    description: z.string(),
    type: z.enum(['explicit', 'inferred'])
  }))
})

export const InterpretationSchema = z.object({
  summary: z.string(),
  management_view: z.string(),
  hidden_blockers: z.array(z.string()),
  ambiguities: z.array(z.string()),
  clarification_questions: z.array(z.string()),
  real_status: z.enum(['green', 'yellow', 'red'])
})

export type ExtractedData = z.infer<typeof ExtractedDataSchema>
export type Interpretation = z.infer<typeof InterpretationSchema>
```

### Database Migration

```sql
-- UP: Create records table for text analysis pipeline
CREATE TABLE records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  source_type TEXT DEFAULT 'text',
  raw_text TEXT NOT NULL,
  label TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  extracted_data JSONB,
  user_corrections JSONB,
  interpretation JSONB,
  error_message TEXT,
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own_records_select" ON records
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "own_records_insert" ON records
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own_records_update" ON records
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE INDEX idx_records_user_created ON records(user_id, created_at DESC);

-- DOWN: DROP TABLE IF EXISTS records;
```

### Environment Variables

```bash
# .env.example additions
ANTHROPIC_API_KEY=your_anthropic_api_key
CLAUDE_EXTRACTION_MODEL=claude-haiku-4-5
CLAUDE_INTERPRETATION_MODEL=claude-sonnet-4-5
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| JSON.parse() on raw Claude text | Structured outputs with `output_config.format` | GA 2025 | Zero parsing errors, type-safe responses |
| Beta header `structured-outputs-2025-11-13` | No header needed (GA) | 2025-2026 | Simpler integration |
| `tool_choice: "required"` JSON hack | `messages.parse()` + `zodOutputFormat()` | SDK ~0.70+ | Native Zod integration, auto-parsed responses |

## Open Questions

1. **Model selection for extraction vs interpretation**
   - What we know: CLAUDE.md says models from env vars, CONTEXT.md gives Claude discretion on model choice
   - What's unclear: Whether haiku is sufficient quality for extraction, or if sonnet is needed for both
   - Recommendation: Default to `claude-haiku-4-5` for extraction (structured, lower complexity) and `claude-sonnet-4-5` for interpretation (requires judgment). Both configurable via env vars. Quality can be tuned post-launch.

2. **Supabase project initialization**
   - What we know: Supabase CLI v2.84.4 is installed. No `supabase/` directory exists yet.
   - What's unclear: Whether the Supabase project is already created in the cloud (auth works in Phase 1, so yes)
   - Recommendation: Run `npx supabase init` to create local directory structure. Migration will need to be applied via `npx supabase db push` or through Supabase dashboard SQL editor.

3. **Three Server Actions vs one for staged loading**
   - What we know: D-02 requires real staged progress. Single Server Action cannot update client mid-execution.
   - What's unclear: Exact latency overhead of three round-trips vs one
   - Recommendation: Use three separate actions. Round-trip overhead (~50ms each) is negligible compared to 5-10s Claude API calls. This provides honest progress reporting.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | Next.js runtime | Yes | (via npm) | -- |
| Supabase CLI | Migrations | Yes | 2.84.4 | Manual SQL via dashboard |
| npm | Package install | Yes | (system) | -- |
| @anthropic-ai/sdk | AI pipeline | To install | 0.80.0 (latest) | -- |
| zod | Schema validation | To install | 4.3.6 (latest) | -- |

**Missing dependencies with no fallback:** None -- all required tools are available or installable.

**Missing dependencies with fallback:**
- `supabase/` directory not initialized -- `npx supabase init` or manual mkdir

## Sources

### Primary (HIGH confidence)
- [Anthropic Structured Outputs docs](https://platform.claude.com/docs/en/build-with-claude/structured-outputs) -- GA support, Zod integration, `messages.parse()` API
- TECH_SPEC.md -- `records` table schema, pipeline architecture, API patterns
- 02-CONTEXT.md -- User decisions D-01 through D-04
- 02-UI-SPEC.md -- Component inventory, layout contract, interaction contract
- package.json -- Current dependency versions

### Secondary (MEDIUM confidence)
- [Vercel Server Action timeout discussion](https://github.com/vercel/next.js/discussions/64437) -- `maxDuration` configuration for long-running Server Actions
- [Vercel timeout KB](https://vercel.com/kb/guide/what-can-i-do-about-vercel-serverless-functions-timing-out) -- Free tier defaults, `vercel.json` configuration
- npm registry -- `@anthropic-ai/sdk@0.80.0`, `zod@4.3.6` version verification

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- Anthropic SDK and Zod are explicitly supported together, verified via official docs
- Architecture: HIGH -- Synchronous pipeline is explicitly recommended in TECH_SPEC.md, structured outputs are GA
- Pitfalls: HIGH -- Vercel timeout, RLS INSERT policy, missing supabase dir are well-documented issues
- AI prompts: MEDIUM -- Exact prompt wording for Russian output quality needs runtime testing

**Research date:** 2026-03-25
**Valid until:** 2026-04-25 (stable stack, well-documented APIs)
