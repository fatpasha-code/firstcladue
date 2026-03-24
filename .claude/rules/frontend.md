# Rule: Frontend Components & Pages

**Glob**: `src/app/**/*.tsx`, `src/components/**/*.tsx`

## Правило

Server Components по умолчанию, `use client` только для interactivity. TypeScript: `any` редкий и обоснованный.

## Server Components — дефолт

```typescript
// ✓ Default — Server Component
export default async function AnalysisPage({ params }: { params: { id: string } }) {
  const data = await getAnalysis(params.id);
  return <AnalysisView data={data} />;
}

// Только если нужна interactivity:
'use client'
export function AnalyzeForm() { /* state, events */ }
```

## 4-State Pattern

Применять для компонентов которые загружают данные или ждут API ответа:

```typescript
if (loading) return <Skeleton />;
if (error) return <Alert variant="destructive">{error}</Alert>;
if (!data || data.length === 0) return <p className="text-muted-foreground">Нет данных.</p>;
return <Content data={data} />;
```

Не применять к: статическим элементам, простым кнопкам, layout компонентам.

## UI библиотека и референсы

- **shadcn/ui** — базовая библиотека проекта: Button, Input, Card, Textarea, Alert и т.д.
- **21st.dev** — референс современных UI-паттернов, layout и interaction ideas
- **uibits.co** — visual inspiration

shadcn/ui предпочтителен для стандартных элементов. Если не подходит — использовать подходящее решение.

## Читаемость JSX

- Не делать компоненты-простыни (200+ строк JSX)
- Выносить повторяющиеся блоки в отдельные компоненты
- Страница = orchestration; компоненты = presentation
- Если JSX трудно читается — сигнал декомпозировать

## Forms → Server Actions

```typescript
// ✓ Good
'use client'
import { submitAnalysis } from '@/app/actions';

export function AnalyzeForm() {
  const handleSubmit = async () => {
    const result = await submitAnalysis(text);
  };
}

// ✗ Bad для этого проекта
fetch('/api/analyze', { method: 'POST', body: JSON.stringify({ text }) });
```

## Accessibility

```typescript
// ✓ Good
<Textarea aria-label="Текст для анализа" placeholder="Вставьте текст..." />
<button type="button">Анализировать</button>  // не <div onClick>

// ✗ Bad
<input />  // без label
<div onClick={handleClick}>Click me</div>  // не keyboard-accessible
```

- ARIA labels на inputs без видимого label
- Semantic HTML: `<button>` не `<div onClick>`, `<nav>` не `<div>`
- Visible focus indicator (не убирать outline без замены)
- Keyboard reachability: основные действия доступны с клавиатуры

## Обязательно

- ✓ Server Components где нет интерактивности
- ✓ TypeScript: `any` редкий и обоснованный
- ✓ ARIA labels на inputs без visible label
- ✓ Semantic HTML (button, nav, main и т.д.)
- ✓ 4-state pattern для async компонентов
- ✓ Server Actions для form submit
- ✓ Читаемый JSX — нет простыней

## Говорить "NO" когда

- Нет loading state при async операции
- Validation error не отображается пользователю
- `<div onClick>` вместо `<button>` без причины
- Нет ARIA label на input без visible label
- `use client` на странице которая не требует interactivity
