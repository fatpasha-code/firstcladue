# ADR-002: Supabase как база данных и auth

**Дата**: 2026-03-24
**Статус**: Accepted

## Решение

Использовать Supabase (PostgreSQL + встроенный Auth) как основной backend.

## Контекст

Нужен database + auth для internal tool. Один пользователь на MVP.

## Причины

1. **PostgreSQL** — структурированные данные, ACID, JSONB для неструктурированного (extracted_data)
2. **Row-Level Security (RLS)** — безопасность на уровне БД, не приложения
3. **Встроенный Auth** — Supabase Auth покрывает потребности MVP без внешних сервисов
4. **Миграции** — стандартный SQL, понятный инструментарий
5. **Цена** — generous free tier для internal tool
6. **Портируемость данных** — стандартный PostgreSQL, можно мигрировать если нужно

## Про Auth

Для internal MVP: Supabase Auth достаточен (email/password или magic link).
Clerk или другой провайдер — только если появятся требования которые Supabase Auth не покрывает.

## Альтернативы

- **Firebase**: NoSQL, меньше гибкости, auth менее гибкий
- **MongoDB**: нет встроенного auth и RLS, хуже для реляционных данных
- **PlanetScale / Neon**: хорошие Postgres варианты, но Supabase даёт больше из коробки

## Ограничения

- Нужно понимать миграции и SQL
- RLS требует внимания при проектировании схемы
