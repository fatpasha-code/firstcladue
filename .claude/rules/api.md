# Rule: API Routes & Server Actions

**Glob**: `src/app/api/**`, `src/app/**/actions.ts`

## Правило

Все API endpoints и Server Actions должны иметь error handling, input validation и правильные status codes.

## Детали

### Input Validation (на входе)
```typescript
// ✓ Good
if (!text || text.length < 10) {
  return Response.json({ error: 'Text too short' }, { status: 400 });
}

// ✗ Bad
const analysis = await extractText(text); // no validation
```

### Status Codes
- `200` — успех
- `400` — плохой request (validation error)
- `401` — не авторизован
- `404` — не найдено
- `429` — rate limit exceeded
- `500` — server error

### Error Handling
```typescript
try {
  // logic
} catch (error) {
  console.error('Error:', error);
  return Response.json({ error: 'Internal error' }, { status: 500 });
}
```

### Rate Limiting
- Analyze endpoint: 10 requests/minute per user
- Check before processing, return 429 if exceeded

### Claude API Calls
- Всегда логируй call и response
- Retry с exponential backoff
- Graceful degradation если API fails

## Обязательно

- ✓ Input validation на входе (не на выходе)
- ✓ Error try/catch (не crash)
- ✓ Правильные status codes
- ✓ Rate limiting проверена
- ✓ Логирование для debugging
- ✓ Tests для critical logic
- ✓ Env variables в .env.example (не в repo)

## Когда говорить "NO"

- "No input validation"
- "Status code 500 for validation error (should be 400)"
- "Rate limit not checked before Claude API call"
- "No error handling (missing try/catch)"
- "Hardcoded API key in code"
- "No test for critical extraction logic"
