# CLAUDE.md — Update Tracker (Внутренний инструмент)

## Что это

Внутренний инструмент для Павла: принимает текст созвонов / переписок / заметок и превращает их в управленческие артефакты.

**Текущий этап**: internal MVP, один пользователь (Павел).
**Не является**: публичным SaaS, коммерческим продуктом, freemium-сервисом.
**Будущее**: может вырасти в продукт — но сейчас всё решения принимаются под single-user MVP.

---

## Что делает

1. Принимает текст (созвон, переписка, заметки)
2. Выделяет: что сделано / в работе / блокеры / кому что / дедлайны
3. Генерирует: недельный отчёт, месячный, follow-up список
4. Делает управленческую интерпретацию технических апдейтов:
   - объясняет что на самом деле происходит
   - выявляет скрытые блокеры и неясности
   - подсказывает что нужно уточнить

---

## Стек

- **Frontend**: Next.js (App Router) + Tailwind CSS + shadcn/ui
  - После инициализации проекта зафиксировать конкретную версию в `package.json`. Не держать версию плавающей. Обновлять сознательно.
- **Backend**: Supabase (PostgreSQL + встроенная Auth)
- **Auth**: Supabase Auth (для MVP достаточно; Clerk — опция для будущего)
- **Deploy**: Vercel
- **AI**: Anthropic SDK — модели выбираются по задаче, не захардкожены (см. ai-agent-architect)
- **MCP**: Context7, Supabase (для документации во время разработки)

Платёжки, product analytics, observability — **future/optional**, не часть v1.

---

## Архитектура (6 модулей)

1. **Auth**: логин, защита страниц
2. **Input**: вставка текста, валидация
3. **Extraction**: Claude API → JSON (done/blockers/deadlines/assignments)
4. **Interpretation**: управленческий разбор технических апдейтов
5. **Reports**: недельный / месячный / follow-up из accumulated extractions
6. **History & Review**: история анализов, просмотр, редактирование, использование для отчётов

---

## Агенты

| Агент | Модель | Фокус |
|-------|--------|-------|
| `planner` | sonnet | Декомпозиция фич на вертикальные слайсы |
| `database-architect` | opus | Схема, миграции, RLS |
| `backend-engineer` | opus | API routes, Server Actions, Claude интеграция |
| `frontend-developer` | sonnet | UI, компоненты, формы |
| `qa-reviewer` | sonnet | **READ-ONLY**: review, тесты, безопасность |
| `ai-agent-architect` | opus | Промпты, AI пайплайны, надёжность |

---

## Ключевые правила

**Процесс**: не кодировать без прочитанной спеки. Если спека не найдена — запросить или создать.

**БД**: все изменения схемы только через миграции. У каждой миграции должен быть rollback plan — не обязательно literal `DOWN`, но способ откатить изменение должен быть известен до применения.

**API**: валидация на входе, правильные status codes, try/catch везде.

**Frontend**: Server Components по умолчанию. 4-state pattern (loading/empty/error/success) для интерактивных компонентов.

**TDD**: тесты для API, критической логики, интеграций. Не для каждого UI-компонента.

---

## Процесс: идея → shipped

1. **Discovery**: описать задачу, зафиксировать в PROJECT_IDEA.md или ADR
2. **Spec**: SPEC_TEMPLATE.md, заполнить все разделы
3. **OpenSpec**: propose → apply → verify → archive
4. **GSD**: процессный слой поверх документов. Source of truth — PROJECT_IDEA.md, TECH_SPEC.md, SPEC_TEMPLATE.md, change docs. GSD помогает по этой правде работать, а не хранит её.
5. **Platform**: Supabase + Vercel + env vars (один раз в начале)
6. **Build**: вертикальные слайсы + vertical/horizontal reviews
7. **Release**: merge в main → deploy
8. **Iterate**: использование → новые изменения

---

## Definition of Done

**MVP уровень** (минимум для merge):
- [ ] Спека написана
- [ ] Код работает (vertical slice)
- [ ] Тесты на критическую логику
- [ ] Code review (qa-reviewer)
- [ ] `.env.example` обновлён

**Production уровень** (перед публичным деплоем, если продукт вырастет):
- [ ] Всё из MVP
- [ ] Error tracking настроен
- [ ] Analytics события добавлены
- [ ] Preview deploy проверен

---

## Метрики успеха (для internal MVP)

- Еженедельный отчёт генерируется за <2 минут
- Extraction полезна после ручной проверки
- Меньше времени на составление отчётов
- Управленческая интерпретация понятна без чтения исходника
- Регулярное использование самим Павлом

---

## Команды

```bash
npm run dev           # Next.js dev server
npm run test          # Тесты
npm run lint          # Lint
npx supabase migration new <name>  # Новая миграция
```
