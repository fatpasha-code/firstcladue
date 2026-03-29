# Phase 3: Record View - Context

**Gathered:** 2026-03-29
**Status:** Ready for planning

<domain>
## Phase Boundary

Страница `/records/[id]` — просмотр и редактирование результатов анализа.
Пользователь видит extraction данные в структурированных табах и интерпретацию Claude.
Может исправить текстовые поля и сохранить правки в `user_corrections`.

Это снимок момента времени (запись созвона/переписки) — не живой таск-борд.
Phase 3 НЕ включает: трекинг выполнения задач, drag-and-drop между статусами, статусы задач.

</domain>

<decisions>
## Implementation Decisions

### Page Header
- **D-01:** Над табами: дата записи (created_at) + label (если задан) + StatusBadge (real_status) + ссылка назад на главную
- **D-02:** raw_text на странице НЕ показывается

### Tab Navigation
- **D-03:** 6 табов: Сделано / В работе / Блокеры / Назначения / Дедлайны / Интерпретация (порядок из ROADMAP.md)
- **D-04:** Пустой таб (нет данных) показывает текст "Ничего не найдено" в muted цвете — не скрывается

### Extraction Tab Content
- **D-05:** Вкладка Блокеры: impact показывается как цветной бейдж — red=high, yellow=medium, gray=low
- **D-06:** Вкладка Дедлайны: дедлайны с type=inferred помечены бейджем "выведен"; explicit — без бейджа
- **D-07:** Вкладка Назначения: person как заголовок, под ним список tasks[]

### Interpretation Tab
- **D-08:** Порядок блоков: real_status → summary → management_view → hidden_blockers → ambiguities → clarification_questions
- **D-09:** hidden_blockers и ambiguities: claim виден сразу; evidence (цитата + speaker) свёрнута за ссылкой "источник ▾"

### Inline Editing
- **D-10:** Режим редактирования включается одной кнопкой "Редактировать" на странице (edit mode toggle)
- **D-11:** Редактируемые поля — все текстовые: description, person, deadline/by_when. Enums (impact, explicit/inferred) — read-only
- **D-12:** Кнопка "Сохранить" сохраняет ВСЕ изменения со ВСЕХ табов одним PATCH запросом в user_corrections
- **D-13:** Кнопка "Отмена" отменяет все несохранённые изменения. Нет auto-save.
- **D-14:** user_corrections хранит полный слепок исправленного extracted_data (не дифф)

### Claude's Discretion
- Конкретные shadcn/ui компоненты для табов (установить shadcn/ui Tabs — radix-based)
- Точный формат даты в шапке (относительный "3 часа назад" vs абсолютный — на усмотрение)
- Точный текст "Ничего не найдено" (формулировка может варьироваться по табам)
- Детали hover/focus состояний в edit mode
- Skeleton loading для загрузки страницы

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Project Spec
- `TECH_SPEC.md` §Module 5: History & Review — record page structure
- `TECH_SPEC.md` §Database Schema — `records` table, `user_corrections` column type
- `CLAUDE.md` — Stack, agent rules, frontend conventions
- `.claude/rules/frontend.md` — Server Components, 4-state pattern, accessibility
- `.claude/rules/api.md` — Server Actions, PATCH endpoint, error handling

### Requirements
- `REQUIREMENTS.md` — EXTRACT-03, EXTRACT-04, INTERP-02, INTERP-03

### Roadmap
- `.planning/ROADMAP.md` §Phase 3 — Plans breakdown and done criteria

### Existing Schemas
- `src/lib/ai/schemas.ts` — ExtractedDataSchema, InterpretationSchema (поля и типы)

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/components/status-badge.tsx` — StatusBadge с green/yellow/red и русскими лейблами. Переиспользовать в шапке страницы и во вкладке Интерпретация
- `src/components/ui/button.tsx`, `card.tsx`, `input.tsx`, `label.tsx`, `alert.tsx` — shadcn/ui компоненты
- `src/lib/supabase/server.ts` — server Supabase client для загрузки записи
- `src/app/actions.ts` — паттерн Server Actions

### Установить
- shadcn/ui Tabs component (ещё не установлен — radix-based, добавить через `npx shadcn@latest add tabs`)

### Established Patterns
- Server Components по умолчанию; `use client` только для edit mode (форма с состоянием)
- Error display: inline, не toast/modal
- 4-state pattern: loading/empty/error/success для async компонентов
- Server Actions: `'use server'`, createClient(), try/catch, возврат `{ error }`

### Integration Points
- Новый route: `src/app/records/[id]/page.tsx` — Server Component, загружает запись по id
- PATCH Server Action для сохранения user_corrections
- Ссылка "← Назад" ведёт на `/` (главная с формой)

</code_context>

<specifics>
## Specific Ideas

- Шапка: дата + label + StatusBadge в одну строку, ссылка назад слева
- Blockers impact: цветные бейджи (red/yellow/gray) рядом с описанием блокера
- Inferred deadlines: бейдж "выведен" серым цветом рядом с датой
- Evidence в interpretation: `claim` — жирным; под ним "источник ▾" — раскрывает цитату курсивом + имя спикера
- Edit mode: все input/textarea заменяют статичный текст; кнопки "Сохранить" / "Отмена" появляются вместо "Редактировать"

</specifics>

<deferred>
## Deferred Ideas

- **Drag-and-drop между статусами** — пользователь хочет перемещать задачи мышкой между "В работе", "Сделано" и т.д. Это превращает запись в живой таск-борд. Требует отдельной фазы — другая модель данных и UI. Записан в backlog.

### Reviewed Todos (not folded)
- `001-pipeline-speed-haiku` — ускорение AI pipeline через смену модели. Не относится к record view, остаётся в pending todos.

</deferred>

---

*Phase: 03-record-view*
*Context gathered: 2026-03-29*
