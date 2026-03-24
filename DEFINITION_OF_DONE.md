# DEFINITION_OF_DONE.md

Два уровня готовности: MVP (текущий) и Production (если продукт вырастет).

---

## MVP DoD (текущий этап — internal tool)

Фича готова к merge когда:

### 1. Спецификация
- [ ] Спека написана (SPEC_TEMPLATE.md или раздел в TECH_SPEC.md)
- [ ] API контракт задокументирован
- [ ] Edge cases описаны

### 2. Код
- [ ] Vertical slice завершён: DB (если нужно) + API/Action + UI
- [ ] TypeScript: `any` редкий и обоснованный, не как норма
- [ ] Нет неожиданных runtime errors в пользовательских сценариях (`console.error` в логах — сигнал для расследования, не сам критерий)

### 3. Тесты
- [ ] Тесты на критическую логику (extraction parsing, API validation)
- [ ] Happy path + основные error cases покрыты
- [ ] `npm run test` проходит

### 4. Безопасность и данные
- [ ] Нет hardcoded secrets
- [ ] `.env.example` обновлён (все новые env vars)
- [ ] RLS включена на новых таблицах с user data
- [ ] Для миграции есть rollback plan (explicit DOWN или задокументированный способ откатить)

### 5. Code Review
- [ ] qa-reviewer прошёлся и сказал OK
- [ ] Нет очевидных N+1 queries

---

## Production DoD (если проект перерастёт в публичный продукт)

Всё из MVP DoD, плюс:

### + Error Tracking
- [ ] Sentry или аналог настроен
- [ ] Критические ошибки логируются

### + Analytics
- [ ] События для ключевых действий добавлены
- [ ] Достаточно для debugging и понимания usage

### + Deploy Verification
- [ ] Preview deploy проверен в браузере
- [ ] Нет ошибок в console
- [ ] Mobile отображение ОК

### + Observability
- [ ] Response time приемлемый
- [ ] Нет утечки user data в logs

---

## Если не ready (MVP)

Не merge если:
- ❌ Нет теста на extraction logic
- ❌ RLS не включена на таблице с user data
- ❌ Validation error возвращает 500 (должен 400)
- ❌ API key hardcoded в коде
- ❌ qa-reviewer не approve

---

## Важно

DoD — это минимум для качественного кода, не бюрократия.
Каждый пункт существует потому что его отсутствие уже создавало проблемы.
