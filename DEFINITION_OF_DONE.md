# DEFINITION_OF_DONE.md

Фича считается **READY FOR PRODUCTION** только если **все 8 пунктов** выполнены:

## 1. ✓ Спецификация

- [ ] SPEC_TEMPLATE.md заполнена полностью (все 8 разделов)
- [ ] Нет TODO или TBD
- [ ] User stories конкретные (не абстрактные)
- [ ] API контракт задокументирован (методы, paths, status codes)
- [ ] Edge cases описаны

## 2. ✓ Код

- [ ] Вертикальный слайс: данные → API → UI → тесты
- [ ] Все файлы следуют паттернам (migrations, Server Actions, shadcn/ui)
- [ ] TypeScript strict mode (no `any`)
- [ ] Нет console.errors в production build

## 3. ✓ Тесты

- [ ] Unit tests на API routes (happy path + error cases)
- [ ] Integration tests если есть DB transactions
- [ ] Edge cases протестированы (empty input, rate limit, API failure)
- [ ] Tests pass `npm run test`
- [ ] Test coverage >80% на critical paths

## 4. ✓ Аналитика

- [ ] PostHog события добавлены в critical paths
  - Примеры: `analysis_created`, `report_generated`, `error_occurred`
- [ ] События содержат полезные параметры (length, type, error_code)
- [ ] Событий достаточно для дебага и мониторинга

## 5. ✓ Обработка ошибок

- [ ] Sentry integration (если есть, то логируются)
- [ ] Все исключения caught (no unhandled rejections)
- [ ] Error messages meaningful (для user и для developer)
- [ ] Status codes правильные (400 для валидации, 500 для сервера)
- [ ] Rate limiting возвращает 429, not 500

## 6. ✓ Code Review

- [ ] qa-reviewer прошёлся и сказал OK
- [ ] Security checks passed (no SQL injection, XSS, auth bypass)
- [ ] RLS policies reviewed
- [ ] Performance OK (no N+1 queries)

## 7. ✓ Preview Deploy

- [ ] Vercel preview deploy успешен
- [ ] Можно кликнуть и проверить фичу живьём
- [ ] Нет ошибок в browser console
- [ ] Мобильная версия работает
- [ ] Responsive OK

## 8. ✓ Конфигурация

- [ ] `.env.example` обновлён (все новые env vars)
- [ ] Нет hardcoded secrets (API keys, passwords)
- [ ] Migrations applied и rolled back успешно
- [ ] Migration has DOWN part (для отката)

---

## Процесс проверки

1. **Developer** → готовит код + тесты + спеку
2. **qa-reviewer** → code review + security check
3. **planner** (if needed) → проверяет что всё matches spec
4. **Vercel** → automatic preview deploy
5. **Merge** → в main после approval
6. **Production** → auto-deploy to Vercel production

---

## Если не ready

Если хотя бы **один** пункт не done → feature не merge-ится.

**Примеры "не ready"**:
- ❌ "No tests on extraction logic"
- ❌ "RLS not enabled on table"
- ❌ "Error status 500 for validation (should be 400)"
- ❌ "PostHog events missing"
- ❌ "qa-reviewer not approved"
- ❌ "Vercel preview broken"
- ❌ ".env.example not updated"

---

## Timeline Impact

Следование DEFINITION_OF_DONE **удлиняет на 1–2 часа за фичу** (тесты + review),
но **сокращает на 5–10 часов потом** (нет баг-фиксов из-за неполноты).

Total ROI: **-6 to -8 hours за 2 недели разработки**.
