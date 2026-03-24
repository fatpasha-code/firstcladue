# Rule: API Routes & Server Actions

**Glob**: `src/app/api/**`, `src/app/**/actions.ts`, `src/app/**/actions/**`

## Правило

Все API endpoints и Server Actions должны иметь input validation, error handling и правильные status codes.

## Input Validation

```typescript
// ✓ Good — валидация на входе, до логики
if (!text || text.trim().length === 0) {
  return Response.json({ error: 'Text is required' }, { status: 400 });
}

// ✗ Bad — нет валидации
const result = await processText(text);
```

## Status Codes

- `200` — успех
- `400` — validation error (плохой request)
- `401` — не авторизован (нет сессии / невалидный токен)
- `403` — авторизован, но нет доступа к этому ресурсу (другой пользователь и т.п.)
- `404` — не найдено
- `500` — server error

Использовать только те, которые реально возникают. Различай 401 и 403 — это разные случаи.
Rate-limit 429 — добавлять если нужен.

## Стандартный формат ошибок

```typescript
// ✓ Good — единый формат
return Response.json({
  error: {
    code: 'VALIDATION_ERROR',     // machine-readable код
    message: 'Text is required'   // human-readable, не internal details
  }
}, { status: 400 });

// ✗ Bad — internal details утекают
return Response.json({ error: error.stack }, { status: 500 });
```

Правило: `message` — то что можно показать пользователю. `code` — для debugging на клиенте.
Не возвращать stack traces, internal class names, DB error messages.

## Error Handling

```typescript
try {
  // логика
} catch (error) {
  console.error('[endpoint-name] error:', error);  // для server logs
  return Response.json({
    error: { code: 'INTERNAL_ERROR', message: 'Something went wrong' }
  }, { status: 500 });
}
```

## Claude API Calls

- Использовать официальный `@anthropic-ai/sdk` (не raw fetch)
- Retry с exponential backoff
- **Не логировать содержимое запросов** (user data) — только ошибки и latency
- Graceful degradation если API недоступен

## Обязательно

- ✓ Валидация на входе (первым делом)
- ✓ try/catch везде
- ✓ Правильные status codes (400 ≠ 500)
- ✓ Нет hardcoded API keys
- ✓ Env variables в `.env.example`
- ✓ Тест для critical logic (extraction, parsing)

## Rate Limiting

Для internal MVP (один пользователь) rate limiting не нужен. Добавлять если/когда продукт станет multi-user.

## Говорить "NO" когда

- Нет input validation
- Validation error возвращает 500 (должен 400)
- API key hardcoded в коде
- Нет error handling (нет try/catch)
- Логируется содержимое AI ответа с user data
