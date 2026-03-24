# Skill: Create Database Migration

Используй этот скилл для создания SQL миграций.

## Процесс

1. Определи что нужно сделать (новая таблица, новый column, индекс, RLS policy)
2. Создай файл: `supabase/migrations/YYYYMMDDHHMMSS_description.sql`
3. Напиши UP часть (что применяется)
4. Напиши DOWN часть (откат)
5. Протестируй локально
6. Закоммитить

## Шаблон для новой таблицы

```sql
-- Create analyses table
CREATE TABLE analyses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  input_text TEXT NOT NULL,
  input_length INTEGER,
  status TEXT DEFAULT 'processing' CHECK (status IN ('processing', 'completed', 'failed')),
  extracted_data JSONB,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE analyses ENABLE ROW LEVEL SECURITY;

-- RLS: Users see only their own analyses
CREATE POLICY "users_own_analyses" ON analyses
  USING (auth.uid()::uuid = user_id);

-- Indexes
CREATE INDEX idx_analyses_user_id ON analyses(user_id);
CREATE INDEX idx_analyses_created_at ON analyses(created_at DESC);

-- DOWN: Rollback
-- DROP TABLE IF EXISTS analyses CASCADE;
```

## Шаблон для добавления column

```sql
-- Add analysis_count to users
ALTER TABLE users ADD COLUMN analyses_count_this_month INTEGER DEFAULT 0;

-- Backfill existing users
UPDATE users SET analyses_count_this_month = (
  SELECT COUNT(*) FROM analyses
  WHERE user_id = users.id
  AND created_at >= DATE_TRUNC('month', NOW())
);

-- DOWN:
-- ALTER TABLE users DROP COLUMN analyses_count_this_month;
```

## Шаблон для RLS policy

```sql
-- Allow users to update their own analyses
CREATE POLICY "users_update_own_analyses" ON analyses
  FOR UPDATE
  USING (auth.uid()::uuid = user_id)
  WITH CHECK (auth.uid()::uuid = user_id);

-- DOWN:
-- DROP POLICY IF EXISTS "users_update_own_analyses" ON analyses;
```

## Чеклист

- [ ] Миграция имеет UP и DOWN части
- [ ] RLS включена для таблиц с user data
- [ ] Foreign keys с ON DELETE CASCADE
- [ ] Индексы на frequently-queried columns
- [ ] UUID для IDs (не auto-increment)
- [ ] timestamptz для времени
- [ ] Миграция протестирована (UP + DOWN locally)
- [ ] Filename: `YYYYMMDDHHMMSS_description.sql`

## Testing локально

```bash
# List current migrations
npx supabase db list

# Apply new migration
npx supabase db reset

# Проверить что таблица создана
\dt (в psql)

# Откатить миграцию (если есть DOWN)
# Обычно это отдельная команда или вручную в UI
```

## Tips

- Всегда включай DOWN part (важно для rollback!)
- Индексы создавай на (user_id, created_at) для аналитик
- RLS первым приоритетом для безопасности
- Не модифицируй старые миграции, создавай новые
