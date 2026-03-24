# Proposed Change: V1 Scope — Update Tracker MVP

**Дата**: 2026-03-25
**Статус**: applied

---

## Что фиксируем

Первая версия приложения: что строим, в каком порядке, что явно за бортом.

---

## V1 Scope

### Что входит

| Модуль | Что делает |
|--------|-----------|
| **Auth** | Вход через email/password или magic link (Supabase Auth). Middleware защищает все страницы. |
| **Input** | Вставка текста, валидация (не пустой, разумный максимум). Создаёт запись в `records`. |
| **Extraction** | Claude API → `extracted_data` (done / in_progress / blockers / assignments / deadlines с пометкой explicit/inferred). |
| **Interpretation** | Claude API → `interpretation` (summary, management_view, hidden_blockers, ambiguities, clarification_questions, real_status). |
| **History & Review** | Список всех записей. Клик → запись. Пометка "просмотрено". Выбор нескольких для отчёта. |
| **Reports** | Генерация weekly / monthly / follow-up из выбранных записей. Просмотр, копирование. |

### Что НЕ входит в v1

- Audio/Video ingestion (поле `source_type` готово, pipeline — нет)
- KPI Drafts / Employee KPI Builder
- Multi-user / доступ для других
- Payments, rate limiting
- PostHog, Sentry (observability — production level, не MVP)
- Экспорт в PDF / Notion / Slack

---

## Рекомендуемый порядок сборки

```
Фаза 1 — Foundation
  1.1 Инициализация Next.js + Supabase + Vercel + env vars
  1.2 Auth (login page, middleware, session)

Фаза 2 — Core Pipeline
  2.1 Ingestion: форма ввода → запись в records
  2.2 Extraction: Claude API → extracted_data
  2.3 Interpretation: Claude API → interpretation
  2.4 Record view: /records/[id] (вкладки + inline редактирование)

Фаза 3 — History & Reports
  3.1 History: /history (список, фильтр, reviewed)
  3.2 Reports: /reports/new + /reports/[id]

Фаза 4 — Polish
  4.1 Error handling, edge cases
  4.2 Manual QA (end-to-end проверка всего пайплайна)
```

---

## Критерии готовности v1

- [ ] Можно вставить текст созвона и получить extraction + interpretation
- [ ] Можно видеть историю всех записей
- [ ] Можно отредактировать результат AI
- [ ] Можно сгенерировать недельный отчёт из 3+ записей
- [ ] Пайплайн работает end-to-end без ошибок на реальном тексте

---

## Влияние

- **БД**: 2 таблицы (`records`, `reports`) — в Database Schema TECH_SPEC.md
- **API**: 6 endpoints / Server Actions — в соответствующих модулях TECH_SPEC.md
- **UI**: 6 страниц (`/login`, `/`, `/records/[id]`, `/history`, `/reports`, `/reports/new`)
- Ничего в спеке не меняется — это фиксация scope, не изменение

---

## Риски

- Синхронная обработка (Extraction + Interpretation) может занимать 15–30 секунд — нужен явный loading state
- Inline редактирование extraction — UX требует внимания, не усложнять в v1
