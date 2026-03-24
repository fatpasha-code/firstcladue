# Skill: Implement Feature (Vertical Slice)

Используй этот скилл когда нужно добавить новую фичу с полным вертикальным слайсом.

## Процесс

1. **Прочитай спеку** → SPEC_TEMPLATE.md или TECH_SPEC.md
2. **Разложи на слайсы** → 2–4 слайса (данные → API → UI → тесты)
3. **Создай миграцию** → database-architect
4. **Создай API** → backend-engineer
5. **Создай UI** → frontend-developer
6. **Добавь тесты** → backend-engineer
7. **Code review** → qa-reviewer
8. **Merge & deploy** → Vercel preview

## Шаблон для Proposal

```markdown
## Feature: [Name]

### Слайсы (в порядке)

1. **Database** (database-architect)
   - Create table `analyses` with columns: id, user_id, input_text, status
   - Add RLS policy: users see own analyses only
   - Create indexes on (user_id, created_at)

2. **API** (backend-engineer)
   - POST /api/analyze — accept text, return { id, status }
   - GET /api/analyses/:id/status — return status
   - Validate: min 10 words, max 100k chars
   - Rate limit: 10/minute per user

3. **UI** (frontend-developer)
   - Page: /analyze with textarea
   - States: empty → loading → success/error
   - Form submit → Server Action → POST /api/analyze
   - Show result on /analyses/:id

4. **Tests** (backend-engineer)
   - Unit: extraction logic (input → JSON)
   - Integration: POST /api/analyze → DB saved
   - Edge cases: empty text, rate limit, API failure

5. **Analytics** (backend-engineer)
   - PostHog event: analysis_created { length, language }
   - Sentry: log errors

### Acceptance Criteria
- [ ] Text min 10 words validated
- [ ] Rate limit enforced (10/minute)
- [ ] Results saved to DB
- [ ] UI shows loading/error/success states
- [ ] Tests pass
- [ ] Vercel preview works

### Timeline
- Database: 30 min
- API: 1 hour
- UI: 1 hour
- Tests: 30 min
- Review: 30 min
Total: ~4 hours (1 day)
```

## Когда использовать

- Новая фича из roadmap
- Refactoring big task на слайсы
- Planning meeting (что делать на неделю)

## Tips

- Всегда спрашивай себя: "Что юзер видит? Что сохраняется в БД? Какой API вызывается?"
- Если слайс >2 часов → разбей ещё меньше
- Parallel: UI + API могут работать одновременно (с mock API)
