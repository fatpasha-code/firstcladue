# ADR-001: Next.js с App Router

**Дата**: 2026-03-24
**Статус**: Accepted

## Решение

Использовать Next.js с App Router (не Pages Router, не Remix, не SvelteKit).

## Контекст

Нужен frontend + backend framework для internal tool.

## Причины

1. **Server Components по умолчанию** — меньше JS, проще data fetching
2. **Server Actions** — формы без отдельного fetch endpoint, меньше кода
3. **API routes в том же repo** — не нужен отдельный backend
4. **Vercel** — нативный хост, zero-config deploy
5. **shadcn/ui и другие инструменты** — нативная поддержка

## Версия

Использовать актуальную стабильную версию на момент инициализации (проверить через `npm info next version`).
Последняя известная: Next.js 15.x. Зафиксировать в package.json.

## Альтернативы

- **Remix**: аналогичная концепция, хорошая альтернатива, но меньше экосистема
- **SvelteKit**: отличный DX, но другой ecosystem и паттерны
- **Vite + React SPA**: проще, но нет SSR и Server Actions

## Ограничения

- App Router продолжает развиваться — следить за changelogs при обновлениях
- Server Actions — паттерн Next.js; при смене фреймворка нужно переписать
