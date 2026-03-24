# Rule: Database & Migrations

**Glob**: `supabase/migrations/**`, `supabase/schema.sql`

## Правило

Все изменения схемы БД **только через миграции**. Ручные SQL на production — запрещены.

## Детали

1. **Новая таблица** → создай миграцию в `supabase/migrations/YYYYMMDDHHMMSS_description.sql`
2. **Изменение таблицы** (add column, change type) → миграция
3. **RLS policy** → миграция
4. **Index** → миграция
5. **Не редактируй** миграции которые уже прошли (создай новую)

## Шаблон миграции

```sql
-- UP: What this migration does
CREATE TABLE analyses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  input_text TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE analyses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users_own_analyses" ON analyses
  USING (auth.uid()::uuid = user_id);

CREATE INDEX idx_analyses_user_id ON analyses(user_id);
CREATE INDEX idx_analyses_created_at ON analyses(created_at DESC);

-- DOWN: Rollback
DROP TABLE IF EXISTS analyses CASCADE;
```

## Обязательно

- ✓ RLS включена для таблиц с данными юзера
- ✓ Foreign keys с ON DELETE CASCADE
- ✓ UUID для IDs (не auto-increment)
- ✓ timestamptz для времени (не обычный timestamp)
- ✓ Индексы на (user_id, created_at)
- ✓ Миграция имеет DOWN часть
- ✓ Проверена локально перед push (миграция + откат)

## Когда говорить "NO"

- "This migration doesn't have a DOWN part"
- "RLS not enabled on user-owned table"
- "Modifying existing migration (should create new)"
- "N+1 query opportunity detected in schema"
