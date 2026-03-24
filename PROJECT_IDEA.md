# PROJECT_IDEA.md — DevSync

## 1. Проблема

**Боль**: Павел (нетехнический менеджер) управляет разработчиком и тратит **2–3 часа в неделю**
на:
- Разбор созвонов и переписок с разработчиком
- Попытку понять что сделано / что в работе / что заблокировано
- Переводу технических деталей в бизнес-язык
- Ручное составление еженедельных отчётов для stakeholders

Результат:
- Отчёты часто неполные или опоздавшие
- Нет структурированного tracking блокеров
- Тратится время на пересказ вместо анализа

---

## 2. Решение

**Процесс**:
1. Павел вставляет текст (call transcript / Slack logs / заметки)
2. AI анализирует и выделяет:
   - **Что сделано** (завершённые tasks)
   - **Что в работе** (в процессе, кому, дедлайн)
   - **Блокеры** (что мешает двигаться)
   - **Кому что** (responsibility mapping)
   - **Дедлайны** (explicit + implicit)
3. AI генерирует:
   - Недельный отчёт (digest для stakeholders)
   - Месячный отчёт (trends + KPI draft)
   - Task list + follow-ups
   - "Перевод" технических апдейтов на нормальный язык
4. Павел экспортирует / делится отчётом

**Выигрыш**: с 2–3 часов ↓ к 15–20 минут в неделю (вставил текст → скопировал отчёт).

---

## 3. Почему сейчас

- **Рынок**: Non-technical managers появились как категория ~5 лет назад, сейчас 30–40% всех
  managers в tech
- **Технологии**: Claude + structured extraction — можно делать это качественно
- **Конкуренция**: Нет direct competitors. Есть Slack bots и Notion templates, но они не дают
  структурированной extraction + отчётов
- **Timing**: Post-AI boom — люди ищут AI tools для specific pains, готовы платить

---

## 4. Целевая аудитория

**Primary**: Non-technical tech leads, managers, PMs (у которых есть разработчик/небольшая team).
- Компании 2–50 человек
- 15–50K$/год зарплата (могут платить $50–200/месяц за tool)
- Используют сейчас: Slack, Google Docs, ручные spreadsheets

**Secondary**: Consultants, contractors (которые нужно отчитываться клиентам за работу
разработчиков).

---

## 5. Архитектура

```
┌─────────────────────────────────────────────┐
│         Frontend (Next.js)                  │
│  • Input page: paste text area              │
│  • Dashboard: past analyses, reports        │
│  • Settings: API keys, report schedule      │
│  • Auth: Clerk login                        │
└────────────────┬────────────────────────────┘
                 │
         ┌───────▼────────┐
         │  AI Extraction │
         │  (Claude API)  │
         │  • Parse text  │
         │  • Extract     │
         │  • Translate   │
         └───────┬────────┘
                 │
    ┌────────────┼────────────┐
    │            │            │
┌───▼─────┐ ┌───▼─────┐ ┌───▼──────┐
│ Supabase│ │PostHog  │ │  Sentry  │
│  • auth │ │ (later) │ │  (later) │
│  • data │ └─────────┘ └──────────┘
│  • docs │
└────────┘
```

**Layers**:
- **Frontend**: Client-side UI, auth, storage of past analyses
- **Backend**: API routes, AI prompt execution, report generation
- **Storage**: Supabase PostgreSQL for users, analyses, reports
- **AI**: Claude API calls (sonnet for extraction, opus for report generation)

---

## 6. Монетизация

**Модель**: Freemium SaaS

| Plan | Цена | Limits |
|------|------|--------|
| **Free** | $0 | 5 analyses/месяц, базовые отчёты |
| **Pro** | $49/месяц | 100 analyses/месяц, advanced reports, weekly digest schedule |
| **Team** | $199/месяц | Unlimited, team access, export to Slack/email |

**Гейтинг**:
- Free → Pro: при превышении лимита
- Pro → Team: кнопка для добавления team members (1-click Stripe upgrade)

**Monetization timing**: MVP на free, платёжка (Stripe / CloudPayments) добавляется в v1.1.

---

## 7. Конкуренты

| Конкурент | Что делает | Чего не хватает |
|-----------|-----------|-----------------|
| **Slack бот (custom)** | Парсит mentions | Нет structured extraction, нет отчётов |
| **Notion database templates** | Ручной tracking issues | Нет AI, требует дисциплины |
| **Asana / Monday.com** | Project management | Сложная кривая обучения, нет AI extraction |
| **ChatGPT + prompt** | Можно попросить анализ | No persistence, нет интеграции, ручной процесс |

**Our advantage**: Специализированный AI + структурированный output + готовые отчёты +
простой UX (paste → read).

---

## 8. План запуска

### Phase 1: MVP (4 недели)
**Goal**: Validate problem, get first users, prove AI extraction works.

- Core: Input → Extraction (what's done/in-progress/blockers) → Basic report
- Auth: Clerk (fastest)
- Deploy: Vercel
- Target: 5–10 beta users (через личные контакты Павла)

### Phase 2: v1.0 (2 недели)
**Goal**: Payments, polish, public beta.

- Add: Payments (CloudPayments), advanced reports, scheduling
- Polish: UX flow, edge cases, error handling
- Launch: Product Hunt, newsletter

### Phase 3: v2.0 (future)
- Team access
- Integrations: Slack export, email digest
- Advanced AI: Sentiment analysis, team dynamics detection

---

## 9. Риски

| Риск | Вероятность | Mitigation |
|------|-------------|-----------|
| AI extraction ошибается | Средняя | Тесты на real data, UX для corrections |
| Нет product-market fit | Средняя | Быстро получить feedback от 5–10 users, pivot |
| Конкуренты копируют | Низкая (пока) | First-mover advantage, community, integrations |
| Цена Claude API | Средняя | Optimize prompts, батчинг, кэширование |
| Compliance (data privacy) | Низкая | Supabase + Data Processing Addendum |

---

## 10. Техдетали

**Tech stack**:
- Frontend: Next.js 14, Tailwind CSS, shadcn/ui
- Backend: Supabase (PostgreSQL) + Edge Functions
- Auth: Clerk
- Deploy: Vercel (preview deployments на каждый деплой)
- AI: Claude API (sonnet for extraction, opus for reports)
- Observability: PostHog (analytics), Sentry (errors) — позже
- Payments: CloudPayments (Russia-first), Stripe (global) — v1.1

**Database schema** (минимум для MVP):
```
users: id, email, name, plan, created_at, updated_at
analyses: id, user_id, input_text, extracted_data (jsonb), created_at
reports: id, user_id, type (weekly/monthly), period_start, period_end, content (jsonb), created_at
```

**RLS**: Каждый user видит только свои analyses и reports.

**API endpoints** (основные):
- `POST /api/analyze` — отправить текст, получить extraction
- `POST /api/reports/generate` — генерить report за период
- `GET /api/analyses` — history
- `GET /api/reports` — список всех отчётов

**Repository structure**:
```
src/
  app/
    page.tsx (landing)
    dashboard/
    analyze/
    reports/
    api/
  lib/
    claude.ts (API calls)
    extraction.ts (logic)
supabase/
  migrations/
```

---

## AI-пайплайн

1. **Input validation** → User paste text
2. **Preprocessing** → Clean, normalize
3. **Extraction** (Claude Sonnet):
   - System prompt: "You are an expert at parsing developer updates..."
   - Input: raw text
   - Output: structured JSON (done/in-progress/blockers/assignments/deadlines)
4. **Report generation** (Claude Opus):
   - Input: structured data + period
   - Output: markdown report (weekly/monthly/KPI)
5. **Translation** (Sonnet):
   - Input: technical update
   - Output: business-friendly version

---

## Метрики успеха (для MVP)

- [ ] 5+ beta users, >1 analysis каждый
- [ ] Average extraction accuracy >80% (user validation)
- [ ] Time to value: <2 минут от paste до report
- [ ] NPS >40
- [ ] Cost per extraction <$0.10 (sustainable)
