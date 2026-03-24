# TECH_SPEC.md — Update Tracker (Internal MVP)

**Этап**: internal MVP, один пользователь
**Не в v1**: payments, PostHog, Sentry, rate limiting, multi-user, audio/video ingestion

---

## Доменная архитектура

Продукт состоит из трёх доменных слоёв:

```
1. INGESTION / TRANSCRIPTION
   Медиа или текст → текстовая запись
   v1: только text input
   next phase: audio/video → транскрипция (Whisper или аналог)

2. ANALYSIS / INTERPRETATION
   Текст → структурированные данные + управленческая интерпретация
   Extraction: что сделано, блокеры, дедлайны, назначения
   Interpretation: суть, скрытые риски, вопросы к разработчику

3. REPORTING
   Несколько обработанных записей → управленческие артефакты
   Weekly / monthly digest, follow-up list
   future: KPI Drafts / Employee KPI Builder
```

---

## Module 1: Auth & Session

### User Stories
- Как пользователь, я хочу войти, чтобы получить доступ к инструменту
- Как пользователь, я хочу выйти
- Как система, я хочу защитить все страницы от неавторизованного доступа

### Модель данных

```sql
-- Supabase Auth управляет пользователями встроенно (auth.users).
-- Отдельная таблица profiles нужна только для дополнительных данных.
-- Для MVP: auth.users достаточно.

-- Опционально, если нужен профиль:
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own_profile" ON profiles USING (auth.uid() = id);
```

### API / Integration
```
Supabase Auth встроен.
Клиент: @supabase/ssr (createServerClient / createBrowserClient)
Middleware: проверка сессии, редирект неавторизованных → /login
```

### Экраны
- `/login` — вход (email/password или magic link)
- Middleware: неавторизованные → `/login`
- После входа → `/` (главная)

---

## Domain 1: Ingestion / Transcription

### v1 — Text Input

#### User Stories
- Как пользователь, я хочу вставить текст созвона / переписки / заметок и запустить анализ
- Как пользователь, я хочу видеть прогресс анализа
- Как пользователь, я хочу видеть ошибку если текст слишком короткий

#### Модель данных

```sql
CREATE TABLE records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  source_type TEXT DEFAULT 'text',  -- 'text' для v1; 'audio' / 'video' в next phase
  raw_text TEXT NOT NULL,
  label TEXT,  -- необязательная метка пользователя
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  error_message TEXT,
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE records ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own_records" ON records USING (auth.uid() = user_id);
CREATE INDEX idx_records_user_created ON records(user_id, created_at DESC);
```

#### API
```
Server Action: createRecord(text: string, label?: string)
  Валидация: непустой текст, разумный максимум (~50 000 символов — уточнить по опыту)
  Создаёт запись со status='pending'
  Запускает analysis pipeline
  Возвращает: { id }
```

#### Как запускается асинхронная обработка

**Важно**: `void runAnalysis(id)` в Vercel serverless ненадёжен — функция может завершиться до окончания обработки.

**Рекомендуемый подход для MVP** (один пользователь, нет требований к concurrency):
- Сделать обработку **синхронной** внутри Server Action. 5–15 секунд ответа — приемлемо для internal tool.
- Пользователь видит loading state пока идёт анализ.

**Если нужен async (future)**:
- Supabase Edge Function, триггерируемая через Database Webhook при insert
- Vercel Background Functions (требует Vercel Pro)
- Выбор механизма — отдельное архитектурное решение, не предполагать дефолт.

#### Экраны
- **`/`** — главная страница: большое textarea, кнопка "Analyze"
  - Состояния: пустое / loading (пока идёт обработка) / error

### next phase — Audio/Video Ingestion

**Не в v1.** Архитектура готова: поле `source_type` в таблице `records` позволит добавить 'audio'/'video' без смены схемы.

Что потребуется:
- Загрузка файла → Supabase Storage
- Транскрипция → Whisper API или аналог
- Результат → `raw_text` в records (тот же pipeline далее)

---

## Domain 2: Analysis / Interpretation

### Module 2a: Extraction (AI)

#### User Stories
- Как система, я хочу распарсить текст и выделить структурированные данные
- Как пользователь, я хочу увидеть что нашёл AI и отредактировать если нужно

#### Модель данных

```sql
-- Добавить к таблице records:
ALTER TABLE records ADD COLUMN extracted_data JSONB;
ALTER TABLE records ADD COLUMN user_corrections JSONB;  -- правки поверх extraction

-- Структура extracted_data:
{
  "done": [{ "description": "...", "person": "..." }],
  "in_progress": [{ "description": "...", "person": "...", "deadline": "..." }],
  "blockers": [{ "description": "...", "impact": "high|medium|low" }],
  "assignments": [{ "person": "...", "tasks": [...], "by_when": "..." }],
  "deadlines": [
    { "date": "...", "description": "...", "type": "explicit" },
    { "date": "...", "description": "...", "type": "inferred" }
    -- explicit = прямо сказано; inferred = выведено из контекста
  ]
}
```

**Важно**: дедлайны выведенные (inferred) должны быть явно помечены — они менее надёжны чем explicit.

#### API
```
(Вызывается как часть createRecord pipeline)
runExtraction(recordId: string): Promise<void>
  Читает raw_text
  Вызывает Claude API (extraction prompt)
  Сохраняет extracted_data, status='completed'
  При ошибке: status='failed', error_message

PATCH /api/records/[id]/corrections
  Body: { corrections: Partial<ExtractedData> }
  Сохраняет user_corrections рядом с оригиналом (не перезаписывает)
```

#### Экраны
- **`/records/[id]`** — результаты
  - Вкладки: Сделано / В работе / Блокеры / Назначения / Дедлайны
  - Inline редактирование каждого элемента
  - Метка "(выведено)" для inferred deadlines

### Module 2b: Interpretation (Управленческий разбор)

#### User Stories
- Как пользователь, я хочу понять что на самом деле происходит — на управленческом языке
- Как система, я хочу выявить скрытые блокеры и неясности
- Как система, я хочу подсказать что стоит уточнить у разработчика

#### Модель данных

```sql
-- Добавить к таблице records:
ALTER TABLE records ADD COLUMN interpretation JSONB;

-- Структура interpretation:
{
  "summary": "Что происходит — 2-3 предложения",
  "management_view": "Что это значит для менеджера: риски, здоровье задач",
  "hidden_blockers": ["..."],  -- пустой массив если нет
  "ambiguities": ["..."],
  "clarification_questions": ["Уточнить у разработчика: ..."],
  "real_status": "green|yellow|red"
}
```

#### API
```
(Вызывается после или вместе с extraction)
runInterpretation(recordId: string): Promise<void>
  Input: raw_text + extracted_data (для контекста)
  Вызывает Claude API (interpretation prompt)
  Сохраняет в records.interpretation
```

#### Экраны
- Отдельная вкладка "Интерпретация" на `/records/[id]`
  - Summary, Management view, Hidden blockers, Ambiguities, Questions to ask

---

## Module 3: History & Review

### User Stories
- Как пользователь, я хочу видеть все прошлые записи
- Как пользователь, я хочу открыть любую запись
- Как пользователь, я хочу отметить запись как "просмотрено"
- Как пользователь, я хочу выбрать несколько записей для генерации отчёта

### Экраны
- **`/history`** — список записей
  - Карточки: дата, метка, статус (pending/completed/failed), reviewed/не reviewed
  - Клик → `/records/[id]`
  - Checkbox для выбора нескольких (для reports)

### API
```
GET /api/records — список с пагинацией
  Response: [{ id, created_at, status, label, reviewed_at, raw_text_preview }]

PATCH /api/records/[id]
  Body: { reviewed: true } | { label: "..." }
```

---

## Domain 3: Reporting

### Module 4: Reports

#### User Stories
- Как пользователь, я хочу сгенерировать недельный отчёт из нескольких записей
- Как пользователь, я хочу получить список follow-up задач
- Как пользователь, я хочу скопировать отчёт

#### Модель данных

```sql
CREATE TABLE reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  type TEXT NOT NULL CHECK (type IN ('weekly', 'monthly', 'follow_up')),
  period_start DATE,
  period_end DATE,
  content TEXT NOT NULL,  -- markdown
  source_record_ids UUID[],
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own_reports" ON reports USING (auth.uid() = user_id);
CREATE INDEX idx_reports_user_created ON reports(user_id, created_at DESC);
```

#### API
```
Server Action: generateReport(params: {
  type: 'weekly' | 'monthly' | 'follow_up',
  recordIds: string[],
  periodStart?: string,
  periodEnd?: string
})
  Читает extracted_data из выбранных records
  Вызывает Claude API (report generation prompt)
  Сохраняет в reports
  Возвращает: { id }

GET /api/reports — список
GET /api/reports/[id] — один отчёт
```

#### Экраны
- **`/reports`** — список + "Generate Report"
- **`/reports/new`** — выбор записей + тип → generate
- **`/reports/[id]`** — markdown + Copy button

---

## Future Scope (не в v1)

### KPI Drafts / Employee KPI Builder

Отдельная вкладка для генерации черновиков КИПов сотрудникам.

**Концепция:**
- Пользователь вводит: шаблон / пример / промпт для конкретного сотрудника
- AI генерирует черновик КИП по заданному формату
- Пользователь редактирует и копирует

**Архитектурная готовность для добавления:**
- Не требует изменений существующих таблиц
- Отдельная таблица `kpi_drafts` (id, user_id, employee_name, template, content, created_at)
- Отдельный Claude prompt (другой тип задачи)
- Новые страницы `/kpi`, `/kpi/new`, `/kpi/[id]`

**Не добавлять в v1.** Зафиксировать как следующий major feature после того как основной pipeline работает.

### Audio/Video Ingestion

Описано выше в Domain 1. Архитектура (поле `source_type`) готова.

---

## Database Schema (полная для v1)

```sql
-- records (объединяет ingestion + analysis в одной таблице для v1)
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

CREATE TABLE reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  type TEXT NOT NULL CHECK (type IN ('weekly', 'monthly', 'follow_up')),
  period_start DATE,
  period_end DATE,
  content TEXT NOT NULL,
  source_record_ids UUID[],
  created_at TIMESTAMPTZ DEFAULT now()
);

-- RLS
ALTER TABLE records ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own_records" ON records USING (auth.uid() = user_id);
CREATE POLICY "own_reports" ON reports USING (auth.uid() = user_id);

-- Indexes
CREATE INDEX idx_records_user_created ON records(user_id, created_at DESC);
CREATE INDEX idx_reports_user_created ON reports(user_id, created_at DESC);
```

**Примечание**: `ON DELETE` поведение для user → records/reports — решать явно. Для internal tool с одним пользователем удаление пользователя маловероятно; если нужно, добавить в отдельную миграцию.

---

## Claude API Integration

```typescript
// Официальный SDK, не raw fetch
import Anthropic from '@anthropic-ai/sdk';
const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// Модели — через env, не хардкожить ID
// CLAUDE_EXTRACTION_MODEL=claude-sonnet-4-6
// CLAUDE_REPORT_MODEL=claude-sonnet-4-6
```

Финальные промпты — в `.claude/agents/ai-agent-architect.md`.
