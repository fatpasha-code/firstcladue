# CODING_PROCESS.md — Development Workflow Rules

## Принципы разработки

### 1. Вертикальные слайсы

Не "сначала backend, потом frontend", а **одна фича от конца до конца**:

```
Фича = Данные (DB) + API (backend) + UI (frontend) + Тесты + Аналитика

Пример: "User sees extracted data"
  → Database: create analyses table + RLS
  → API: POST /api/analyze + GET /api/analyses/:id/status
  → UI: /analyze page + /analyses/:id results page
  → Tests: unit tests on extraction, integration tests on API
  → Analytics: PostHog events on success/error

Timeline: 4–6 часов для такой фичи (1 день)
```

### 2. TDD selectively

Пишешь **tests ПЕРЕД кодом** для:
- ✓ API routes (input validation, status codes)
- ✓ Critical business logic (extraction, payments)
- ✓ Integrations (Claude API, Supabase queries)

НЕ пишешь tests для:
- ✗ Каждый UI компонент (слишком медленно)
- ✗ shadcn/ui components (они уже протестированы)

**Цель**: >80% coverage на API + logic, <30% на UI.

### 3. Vertical Review (end-to-end)

После каждой фичи прогуляйся по пути пользователя:

1. User opens page → UI renders correctly
2. User types text → validation works
3. User submits → API called, DB updated
4. User sees result → data displayed, states (loading/success/error) work
5. User refreshes → data persists
6. User logs out → data inaccessible to others (RLS)

**Время**: 15–30 минут на фичу, catches ~70% bugs.

### 4. Horizontal Review (consistency)

Проверь что соседние части работают одинаково:

- **Error handling**: `/api/analyze` и `/api/reports/generate` обрабатывают errors одинаково?
- **RLS patterns**: все таблицы с user data имеют policy?
- **Validation**: character limits проверяются в API и UI одинаково?
- **Logging**: PostHog events в обоих endpoints логируются?

**Время**: 10–15 минут, catches ~30% bugs.

### 5. Hooks обязательно

Pre-commit, pre-push, pre-release чеки:

```bash
# Pre-commit: lint + format
npm run lint --fix

# Pre-push: tests pass
npm run test

# Pre-release: env vars OK
grep -r "process.env" src/ # no .env values should be hardcoded
```

**Без hooks**: легко запушить неработающий код, потратить 2 часа на дебаг.

### 6. Migration Policy

Любые изменения схемы БД **только через миграции**:

```sql
-- Good: миграция с UP и DOWN
supabase/migrations/20240324100000_add_analyses_table.sql
  UP: CREATE TABLE analyses (...)
  DOWN: DROP TABLE analyses;

-- Bad: руками в Supabase UI
```

**Почему**: В 20% случаев нужен откат. Без миграций откатываешь 2 часа вручную.

---

## 10-шаговый процесс

### 1. Discovery
Обсудить идею, сформулировать problem statement.
- Input: "Юзер хочет видеть extracted data"
- Output: PROJECT_IDEA.md раздел

### 2. Specification
Развёрнутое описание в SPEC_TEMPLATE.md.
- Input: идея
- Output: 8 разделов спеки (данные, API, UI, edge cases)
- Owner: planner + product owner

### 3. OpenSpec Proposal
Добавить change в OpenSpec (propose → apply → verify → archive).
- Input: спека
- Output: proposal для первой версии MVP

### 4. GSD Configuration
GSD принимает артефакты как source of truth.
- Input: спека + proposal
- Output: GSD tasks созданы

### 5. Platform Setup
Подключить Supabase + Vercel + Clerk + платёжку + основные env vars.
- Owner: backend-engineer + database-architect
- Delay: только если первый раз (потом переиспользуется)

### 6. MCP & Documentation
Включить Context7 + Supabase docs + GitHub.
- Owner: any agent
- Delay: один раз в начале

### 7. Build Loop
Вертикальные слайсы:

```
For each slice:
  → Propose (planner + spec)
  → Apply (database/backend/frontend agents)
  → TDD (write tests for critical logic)
  → Vertical review (end-to-end user path)
  → Horizontal review (consistency checks)
  → Preview deploy (check on Vercel)
```

Timeline: 4–6 часов за slice.

### 8. Observability
PostHog events + Sentry errors + Clarity (позже).
- Owner: backend-engineer
- When: during build, not after

### 9. Release
Merge в main + auto-deploy to Vercel production.
- Owner: qa-reviewer approval
- Requirement: DEFINITION_OF_DONE все 8 пунктов

### 10. Iterate
Собрать данные из PostHog/Clarity/Sentry → новый change в OpenSpec.
- Owner: product owner
- Frequency: еженедельно

---

## Типичная неделя

**Monday**:
- Discovery (30 min) + Spec (2 hours) → SPEC_TEMPLATE.md готов
- OpenSpec proposal → GSD tasks

**Tuesday–Thursday**:
- Build loop: 2–3 слайса, каждый 4–6 часов
- Reviews между слайсами

**Friday**:
- Финальная vertical review + release
- Observability setup + production deploy
- Retrospective на process

---

## Когда что-то сломалось

| Проблема | Причина | Решение |
|----------|---------|---------|
| API возвращает 500 | Нет error handling | Добавить try/catch, вернуть 400/429 |
| N+1 query | Нет индексов | Добавить миграцию с индексом |
| RLS не работает | Policy не включена | Включить RLS, создать policy |
| Rate limit не работает | Не проверяется перед API call | Добавить check, return 429 |
| UI не показывает error | Нет error state | Добавить 4-state pattern |

---

## Tools & Commands

```bash
# Development
npm run dev                # Next.js dev server
npm run test              # Run tests
npm run lint              # Lint check
npm run build             # Build for production

# Database
npx supabase db list      # List migrations
npx supabase db reset     # Reset local DB (dangerous!)
npx supabase migration new # Create new migration

# Deployment
git push origin main      # Auto-deploy to Vercel preview
git merge main            # Merge PR → auto-deploy to production

# Debugging
npm run dev -- --debug    # Next.js debug mode
# Then: node --inspect-brk ./node_modules/.bin/next dev
```

---

## Success Metrics

**Per feature**:
- ✓ Tests pass (>80% coverage on API/logic)
- ✓ DEFINITION_OF_DONE all 8 items checked
- ✓ Vercel preview works
- ✓ qa-reviewer approval

**Per week**:
- ✓ 2–3 features shipped
- ✓ No critical bugs on production
- ✓ <2% error rate on new features

**Per month**:
- ✓ MVP ready for beta
- ✓ 5+ beta users
- ✓ NPS >40
- ✓ Cost per extraction <$0.10
