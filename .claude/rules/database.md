# Rule: Database & Migrations

**Glob**: `supabase/migrations/**`, `supabase/schema.sql`

## Правило

Все изменения схемы БД только через миграции. Ручные SQL в Supabase UI на production — запрещены.

## Что требует миграции

- Новая таблица
- Добавление/изменение/удаление column
- Изменение типа данных
- Добавление/изменение RLS policy
- Добавление/удаление index
- Изменение constraint

## Шаблон

```sql
-- UP: что делает эта миграция
CREATE TABLE table_name (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE table_name ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own_rows" ON table_name USING (auth.uid() = user_id);
CREATE INDEX idx_table_user_created ON table_name(user_id, created_at DESC);

-- DOWN: откат
-- DROP TABLE IF EXISTS table_name;
```

## Правила

- ✓ RLS для таблиц с user data (обязательно)
- ✓ UUID для IDs
- ✓ TIMESTAMPTZ для времени (не просто TIMESTAMP)
- ✓ У каждой миграции есть rollback plan (explicit DOWN если безопасен; иначе — задокументированный способ откатить)
- ✓ Файл назван: `YYYYMMDDHHMMSS_description.sql`
- ✓ Не редактировать уже применённые миграции — создавать новые

## Шаблон выше — для user-owned данных

Шаблон с `user_id REFERENCES auth.users(id)` и индексом на `(user_id, created_at DESC)` — типовой для таблиц принадлежащих пользователю. Не универсальный закон для справочников, join-таблиц и т.д.

## ON DELETE CASCADE

Добавлять осознанно, не как дефолт:
- Подходит: удаление родителя должно автоматически удалять дочерние записи
- Не подходит: хочется сохранить историю, orphaned records нужны для аудита

## Говорить "NO" когда

- Нет никакого rollback plan (ни DOWN, ни описания как откатить)
- RLS не включена на таблице с user data
- Редактируется уже применённая миграция
