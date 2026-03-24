# Skill: Create Database Migration

Использовать для любых изменений схемы БД.

## Процесс

1. Определить что нужно сделать (новая таблица / column / index / RLS policy / constraint)
2. Создать файл: `supabase/migrations/YYYYMMDDHHMMSS_description.sql`
3. Написать UP часть
4. Добавить rollback plan (explicit DOWN если безопасен; иначе — комментарий с описанием как откатить)
5. Протестировать локально
6. Закоммитить

## Шаблон: новая таблица (user-owned данные)

```sql
-- UP: что делает эта миграция
CREATE TABLE table_name (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  -- поля по спеке
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE table_name ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own_rows" ON table_name USING (auth.uid() = user_id);

-- Indexes: добавлять только на поля в реальных queries
-- Этот индекс для списка записей пользователя по дате:
CREATE INDEX idx_table_user_created ON table_name(user_id, created_at DESC);

-- Rollback plan:
-- DROP TABLE IF EXISTS table_name;
```

**Примечание**: шаблон выше для таблиц с user_id. Для других таблиц (справочники, join-таблицы) структура другая — применять по смыслу.

## Шаблон: добавить column

```sql
-- UP: add column_name to table_name
ALTER TABLE table_name ADD COLUMN column_name TYPE;

-- Rollback:
-- ALTER TABLE table_name DROP COLUMN column_name;
```

## Шаблон: добавить RLS policy

```sql
-- UP: policy name
CREATE POLICY "policy_name" ON table_name
  FOR [ALL|SELECT|INSERT|UPDATE|DELETE]
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);  -- WITH CHECK нужен для INSERT/UPDATE

-- Rollback:
-- DROP POLICY IF EXISTS "policy_name" ON table_name;
```

## ON DELETE CASCADE

Добавлять осознанно, не как дефолт. Подходит когда удаление родителя должно автоматически удалять дочерние записи. Не подходит когда хочется сохранить историю.

## Чеклист

- [ ] Файл назван: `YYYYMMDDHHMMSS_description.sql`
- [ ] Есть rollback plan (explicit DOWN или задокументированный способ)
- [ ] RLS включена на таблицах с user data
- [ ] Indexes только на поля в реальных queries
- [ ] Не редактирую уже применённую миграцию
- [ ] Протестировано локально (UP + попытка DOWN)

## Команды

```bash
npx supabase migration new <description>  # Создать файл с правильным именем
npx supabase db reset                     # Применить все миграции локально (сбрасывает БД!)
```
