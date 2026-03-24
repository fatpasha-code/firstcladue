# TECH_SPEC.md — DevSync Technical Specification

## Module 1: Authentication & User Management

### User Stories
- Как новый пользователь, я хочу зарегистрироваться через email/Google, чтобы получить доступ к приложению
- Как зарегистрированный пользователь, я хочу войти через Clerk, чтобы видеть свои анализы
- Как пользователь, я хочу выйти, чтобы закончить сессию
- Как пользователь, я хочу увидеть мой тарифный план и возможность апгрейда

### Модель данных
```
users
  id: uuid (PK)
  clerk_id: text (UNIQUE, NOT NULL)
  email: text (UNIQUE, NOT NULL)
  full_name: text
  plan: text (DEFAULT 'free', enum: 'free'/'pro'/'team')
  analyses_count_this_month: integer (DEFAULT 0)
  created_at: timestamptz (DEFAULT now())
  updated_at: timestamptz (DEFAULT now())

RLS Policies:
  SELECT: auth.uid() = user_id (users видят только себя)
  UPDATE: auth.uid() = user_id
  DELETE: auth.uid() = user_id OR is_admin
```

### API & Server Actions
```
POST /api/auth/callback
  - Clerk webhook для sync user data в Supabase

GET /api/me
  Response: { id, email, full_name, plan, analyses_count_this_month }
  Status: 200 | 401 (not authenticated)

POST /api/auth/upgrade
  Body: { plan: 'pro' | 'team' }
  Response: { session_id } (Stripe session)
  Status: 200 | 400 (invalid plan) | 401
```

### Экраны & Компоненты
- **Auth Flow**:
  - Landing page (unauthenticated): "Sign in with Clerk" button
  - Clerk modal: email + password / Google OAuth
  - Redirect to `/dashboard` post-auth
- **Dashboard**:
  - Header: "Welcome, [Name]" + plan badge + settings icon
  - Navbar: Home / History / Settings
  - Plan upgrade banner (если free и >3 analyses this month)

### Бизнес-логика
- Free план: 5 analyses/месяц (limit проверяется перед analyze call)
- Pro план: 100 analyses/месяц
- Team план: unlimited (но отдельная логика для team management)
- При превышении лимита: показать modal "Upgrade to continue" → Stripe redirect

### Крайние случаи
- Пользователь удалён в Clerk но записи в Supabase есть: migration script на production
- Одновременный upgrade + analyze запросы: transactional lock на analyses_count
- Clerk webhook отстал: background job для resync

---

## Module 2: Text Input & Preprocessing

### User Stories
- Как пользователь, я хочу вставить текст (call transcript / Slack logs / заметки), чтобы начать анализ
- Как пользователь, я хочу увидеть очистку текста (удаление дубликатов, форматирование)
- Как пользователь, я хочу видеть прогресс анализа ("extracting..." → "done")
- Как пользователь, я хочу видеть ошибку если текст слишком короткий или формат неподдерживаемый

### Модель данных
```
analyses
  id: uuid (PK)
  user_id: uuid (FK users.id)
  input_text: text (NOT NULL)
  input_length: integer
  input_language: text (DEFAULT 'en', enum: 'en'/'ru')
  status: text (enum: 'processing'/'completed'/'failed')
  error_message: text (nullable)
  created_at: timestamptz
  updated_at: timestamptz

RLS: SELECT/UPDATE/DELETE: auth.uid() = user_id
```

### API & Server Actions
```
POST /api/analyze (Server Action)
  Body: { text: string }
  Response: { id, status } (immediate response, async processing)
  Status: 200 | 400 (text too short <10 words) | 401 | 429 (rate limit)

GET /api/analyses/:id/status
  Response: { id, status, error_message? }
  Status: 200 | 404 (not found or not owned)
```

### Экраны & Компоненты
- **Analyze Page**:
  - Textarea: "Paste call transcript, Slack logs, or notes..."
  - Character counter: "1,234 / 100,000 chars"
  - Submit button (disabled if <10 words or >100k chars)
  - Error message: "Text too short. Minimum 10 words."
- **Processing State**:
  - Spinner: "Analyzing..."
  - Real-time progress (polling /api/analyses/:id/status every 2s)
- **Success State**:
  - "Analysis complete!" → Redirect to `/analyses/:id/results`

### Бизнес-логика
- Min length: 10 words
- Max length: 100,000 chars
- Rate limit: 10 requests/minute per user
- Language auto-detect (en/ru, fallback to en)
- Preprocessing: trim whitespace, normalize quotes, remove control characters

### Крайние случаи
- Пользователь закрыл браузер во время processing: analysis продолжится в background, user может вернуться и увидеть результат
- Текст содержит только numbers/symbols: отклонить с "Invalid text format"
- API crash во время processing: graceful degradation, retry с exponential backoff

---

## Module 3: AI Extraction (Done / In-Progress / Blockers / Assignments / Deadlines)

### User Stories
- Как система, я хочу распарсить текст и выделить что сделано, чтобы показать пользователю
- Как система, я хочу найти блокеры и кому они нужны, чтобы пользователь мог действовать
- Как система, я хочу найти дедлайны (явные и неявные), чтобы пользователь видел риски
- Как система, я хочу сделать ошибки исправляемыми (allow user corrections)

### Модель данных
```
extracted_data (jsonb inside analyses)
{
  "done": [
    { "description": "Implemented payment API", "person": "Bob", "confidence": 0.95 }
  ],
  "in_progress": [
    { "description": "Testing dashboard", "person": "Alice", "deadline": "2024-03-28", "confidence": 0.85 }
  ],
  "blockers": [
    { "description": "Waiting for database schema from DevOps", "impact": "high", "assigned_to": "Charlie" }
  ],
  "assignments": [
    { "person": "Alice", "tasks": ["..."], "by_date": "2024-03-28" }
  ],
  "deadlines": [
    { "date": "2024-03-28", "description": "Feature launch", "confidence": 0.9 }
  ],
  "confidence_scores": {
    "overall": 0.87,
    "notes": "High confidence on done/blockers, medium on deadlines (implicit)"
  }
}
```

### API & Server Actions
```
POST /api/extract (internal, called by analyze)
  Body: { analysis_id, input_text }
  Response: { success, extracted_data, error? }
  Calls: Claude Sonnet API with system prompt

POST /api/analyses/:id/corrections (allow user to fix extraction)
  Body: { field: 'done' | 'blockers' | 'deadlines', corrections: [...] }
  Response: { updated: true }
  Status: 200 | 404 | 400
```

### Экраны & Компоненты
- **Extraction Results Page**:
  - Tabs: Done / In-Progress / Blockers / Assignments / Deadlines
  - Each item: editable card (click to edit, save/cancel buttons)
  - Confidence badges: "✓ High confidence" / "⚠ Medium (user should verify)"
- **Edit Mode**:
  - Inline edit or modal
  - Save → POST /api/analyses/:id/corrections

### Бизнес-логика
- Extraction via Claude Sonnet API with structured output (JSON mode)
- System prompt: "Parse developer updates and extract: done items, in-progress, blockers, assignments, deadlines. Output valid JSON."
- Confidence scoring: 0.5–1.0 based on keywords and context
- User corrections: stored as audit trail (editable field in analysis)

### Крайние случаи
- Текст на смешанном языке (en + ru): auto-detect, process, translate if needed
- Нет явных дедлайнов: попробовать вывести из контекста ("by Friday", "next sprint")
- Одна задача -> несколько людей: split на отдельные assignment items
- Conflicting info (e.g., "done" + "in-progress" same task): flag for user correction

---

## Module 4: Report Generation (Weekly / Monthly / KPI Draft / Task List)

### User Stories
- Как пользователь, я хочу получить недельный отчёт (digest выполненного за неделю)
- Как пользователь, я хочу получить месячный отчёт с трендами
- Как пользователь, я хочу видеть KPI draft (productivity, velocity)
- Как пользователь, я хочу список follow-up tasks

### Модель данных
```
reports
  id: uuid (PK)
  user_id: uuid (FK users.id)
  type: text (enum: 'weekly'/'monthly'/'kpi'/'follow_up')
  period_start: date
  period_end: date
  content: jsonb (markdown report)
  analysis_ids: uuid[] (references to analyses used)
  created_at: timestamptz

RLS: SELECT/UPDATE/DELETE: auth.uid() = user_id
```

### API & Server Actions
```
POST /api/reports/generate (Server Action)
  Body: { type: 'weekly' | 'monthly' | 'kpi', period_start, period_end }
  Response: { id, content }
  Calls: Claude Opus API with aggregated extraction data
  Status: 200 | 400 (invalid period) | 401

GET /api/reports/:id
  Response: { id, type, period_start, period_end, content }
  Status: 200 | 404 | 401

GET /api/reports
  Query: ?type=weekly&from=2024-03-01&to=2024-03-31
  Response: [{ id, type, period_start, period_end, created_at }]
  Status: 200 | 401
```

### Экраны & Компоненты
- **Reports Page**:
  - Filters: Type (Weekly/Monthly/KPI), Date range
  - List of reports with date, type, preview
  - "Generate New Report" button
- **Report View**:
  - Full markdown rendered (using react-markdown)
  - Copy to clipboard button
  - Export as PDF / DOCX button (future)
  - Metadata: Generated on [date], based on [N] analyses

### Бизнес-логика
- **Weekly**: Summary of done/blockers/blockers resolved from last 7 days
- **Monthly**: Trends (productivity trend chart data), top blockers, team health
- **KPI Draft**: Velocity (tasks/week), blocker resolution rate, team capacity %
- **Follow-up**: Open tasks + assignments + blockers needing action
- Report generation via Claude Opus (more capable for complex analysis)

### Крайние случаи
- Период пуст (нет analyses): "No data for this period. Add analyses to generate report."
- User corrections после создания report: не перестраивать автоматически, allow manual re-generation
- Много analyses в периоде: summarize top 20, note "...and [N] more"

---

## Module 5: Technical Translation (Plain Language)

### User Stories
- Как пользователь (non-technical), я хочу увидеть перевод технического update на нормальный язык
- Как система, я хочу сохранить точность при упрощении (не потерять важные детали)
- Как пользователь, я хочу увидеть оба варианта (original + translation) для verify

### Модель данных
```
translations (nullable, stored with analysis)
{
  "original_text": "Deployed v2.1.3 to staging, need to run DB migrations for new audit table",
  "translated_text": "We've updated the system to the latest version on our test environment. We need to update the database structure for the new activity logging feature.",
  "confidence": 0.92,
  "key_points": [
    "Version deployed",
    "Environment: staging (test)",
    "Action needed: database update",
    "Reason: enable activity logging"
  ]
}
```

### API & Server Actions
```
POST /api/translate (Server Action, called after extraction)
  Body: { analysis_id, technical_text: string }
  Response: { translated_text, key_points, confidence }
  Calls: Claude Sonnet API
  Status: 200 | 400 | 401

GET /api/analyses/:id/translation
  Response: { original, translated, key_points, confidence }
  Status: 200 | 404 | 401
```

### Экраны & Компоненты
- **Translation View**:
  - Split panel: Original (left) | Translation (right)
  - Key points bullet list
  - Confidence badge
  - Copy button (for translated text)
- **Inline in Reports**: Technical updates wrapped with [translation tooltip](hover shows plain version)

### Бизнес-логика
- Triggered automatically after extraction (async)
- System prompt: "Translate this technical update to plain business English. Keep all key info but remove jargon."
- Key points extraction: bullet list of 3–5 main ideas
- Confidence: based on ambiguity detection (0.5–1.0)

### Крайние случаи
- Already plain English text: return original + high confidence (1.0)
- Mixed languages: translate all to English, note language mix
- Unclear/ambiguous technical text: lower confidence (0.6–0.7), ask user to clarify
- Very short text: might not need translation, flag with confidence 0.3

---

## Database Schema (Full)

```sql
-- users
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clerk_id TEXT UNIQUE NOT NULL,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  plan TEXT DEFAULT 'free' CHECK (plan IN ('free', 'pro', 'team')),
  analyses_count_this_month INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- analyses
CREATE TABLE analyses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  input_text TEXT NOT NULL,
  input_length INTEGER,
  input_language TEXT DEFAULT 'en',
  status TEXT DEFAULT 'processing' CHECK (status IN ('processing', 'completed', 'failed')),
  extracted_data JSONB,
  translations JSONB,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- reports
CREATE TABLE reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('weekly', 'monthly', 'kpi', 'follow_up')),
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  content JSONB NOT NULL,
  analysis_ids UUID[],
  created_at TIMESTAMPTZ DEFAULT now()
);

-- RLS Policies (all tables)
CREATE POLICY "users_own_analyses" ON analyses
  USING (auth.uid()::uuid = user_id);
CREATE POLICY "users_own_reports" ON reports
  USING (auth.uid()::uuid = user_id);
```

---

## Integration Points

**Claude API Integration**:
- Extraction: `POST https://api.anthropic.com/v1/messages` with `model: claude-3-5-sonnet-20241022`
- Report generation: `POST https://api.anthropic.com/v1/messages` with `model: claude-opus-4-6`
- Translation: Sonnet model

**Clerk Integration**:
- Auth via Clerk UI component
- Webhook: `POST /api/auth/callback` to sync user data to Supabase

**Supabase Integration**:
- `createServerComponentClient` in Server Components
- `createServerActionClient` in Server Actions
- RLS enforced at database level

---

## AI Prompts (High-Level)

**Extraction Prompt**:
```
System: "You are an expert at parsing developer updates and meetings.
Extract: done items, in-progress tasks, blockers, team assignments, and deadlines.
Output valid JSON with structure: { done: [], in_progress: [], blockers: [], assignments: [], deadlines: [] }"
```

**Report Generation Prompt**:
```
System: "You are a business analyst. Convert developer updates into clear reports.
Create a [weekly/monthly/kpi] report summarizing: completed work, blockers, team productivity, and next steps.
Output in markdown."
```

**Translation Prompt**:
```
System: "Translate technical jargon to plain business English. Keep all key information.
Provide: translated text, and 3-5 key points for non-technical reader."
```
