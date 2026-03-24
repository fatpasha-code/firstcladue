# SPEC_TEMPLATE.md — Feature Specification Template

Copy this for every new feature. Fill all 8 sections. No TODOs or "TBD".

---

# Спецификация фичи: [FEATURE NAME]

## 1. Описание

**Что это делает**: [1–2 предложения о том что пользователь может сделать]

**Для кого**: [кто будет использовать]

**Зачем**: [проблема которую решаем]

**Пример сценария**: [конкретный сценарий использования]

---

## 2. User Stories

Список историй в формате "Как [роль], я хочу [действие], чтобы [результат]".

- Как пользователь, я хочу [действие], чтобы [результат]
- Как пользователь, я хочу [действие], чтобы [результат]
- Как система, я хочу [действие], чтобы [результат]

Минимум 3 истории. Включи основной сценарий и крайние случаи.

---

## 3. Модель данных

**Новые таблицы или columns**:

```
table_name
  id: uuid (PK)
  user_id: uuid (FK users.id)
  field_name: type (constraints)
  created_at: timestamptz

RLS: SELECT/UPDATE: auth.uid() = user_id
Indexes: (user_id, created_at)
```

**Изменения в существующих таблицах**: (если есть)

---

## 4. API / Server Actions

**Endpoints или Server Actions**:

```
POST /api/feature
  Body: { param1: type, param2: type }
  Response: { id, status, data }
  Status codes: 200 | 400 | 401 | 404 | 429 | 500
  Rate limit: X requests per minute

GET /api/feature/:id
  Response: { id, ... }
  Status: 200 | 404 | 401
```

Или для Server Actions:

```
'use server'
export async function featureAction(data: { param1, param2 })
  Return: { success, data, error? }
```

---

## 5. Экраны и компоненты

**Страницы**:
- `/path` — название, описание, когда видна

**Компоненты**:
- ComponentName — что отображает, states (loading/empty/error/success), actions

**States для каждого компонента**:
- **loading**: спиннер
- **empty**: "No data. [action to create]"
- **error**: красная alert с сообщением
- **success**: данные отображены, можно действовать

---

## 6. Бизнес-логика

**Правила валидации**:
- Min/max length, format, required fields
- Примеры: "text min 10 words, max 100k chars"

**Ограничения**:
- Rate limits, quotas, permissions
- Примеры: "10 analyses per minute per user"

**Формулы** (если есть):
- Как считаются значения (confidence score, velocity, etc.)

**Условия переходов** (если есть):
- Когда status меняется с processing → completed

---

## 7. Крайние случаи (Edge Cases)

| Сценарий | Ожидаемое поведение |
|----------|-------------------|
| Пользователь не авторизован | Показать 401 error |
| Текст пустой | Валидационная ошибка "min 10 words" |
| API не отвечает | Retry с exponential backoff, then graceful error |
| Rate limit exceeded | 429 status, "Try again in 1 minute" |
| Одновременные updates | Transactional lock, last-write-wins |

---

## 8. Приоритет и зависимости

**Приоритет**: (Critical / High / Medium / Low)

**Зависимости** (что должно быть готово до этого):
- Feature X (must be done before)
- Feature Y (nice to have before)

**Blocked by** (если что-то блокирует):
- [Issue](link)

---

## Acceptance Criteria

Фича ready to merge когда:
- [ ] Спека заполнена полностью (все 8 разделов)
- [ ] Код написан (vertical slice: данные + API + UI)
- [ ] Тесты написаны (API + critical logic)
- [ ] Code review passed (qa-reviewer)
- [ ] PostHog события добавлены
- [ ] Sentry обработка ошибок
- [ ] Vercel preview работает
- [ ] DEFINITION_OF_DONE все 8 пунктов

---

## Timeline

**Estimated**: 4–8 часов

**Breakdown**:
- Database: 1 hour
- API: 2 hours
- UI: 2 hours
- Tests: 1 hour
- Review: 1 hour
