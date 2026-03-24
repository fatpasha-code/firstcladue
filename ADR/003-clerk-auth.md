# ADR-003: Auth — Supabase Auth для MVP

**Дата**: 2026-03-24
**Статус**: Accepted (пересмотрен с первоначального Clerk)

## Решение

Использовать **Supabase Auth** (не Clerk, не NextAuth, не Auth0).

## Контекст

Инструмент — internal MVP, один пользователь (Павел). Нужна защита страниц, сессия, возможность войти.

## Причины

1. **Достаточно для одного пользователя** — не нужна мультиаккаунтность, OAuth, team management
2. **Нет внешних зависимостей** — auth и БД в одном сервисе (Supabase), меньше moving parts
3. **RLS работает нативно** — `auth.uid()` из Supabase Auth прямо в RLS policies
4. **Бесплатно** — нет лимитов на auth для personal use
5. **Простота** — email/password или magic link, всё из коробки

## Почему не Clerk

Clerk — хорошее решение для multi-user SaaS. Для single-user internal tool:
- Добавляет внешний сервис и webhook-синхронизацию с Supabase
- Требует маппинга Clerk user ↔ Supabase user
- Платный при масштабировании

**Если проект вырастет в multi-user** — переоценить Clerk или Supabase Auth для публичного продукта.

## Ограничения

- Supabase Auth менее feature-rich для сложных сценариев (SSO, SAML, organization management)
- При росте продукта — возможно нужно пересмотреть
