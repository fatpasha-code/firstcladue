# Rule: Frontend Components & Pages

**Glob**: `src/app/**/*.tsx`, `src/components/**/*.tsx`

## Правило

Все компоненты должны иметь 4 состояния (loading/empty/error/success) и использовать shadcn/ui.

## Детали

### 4 States Pattern
```typescript
if (loading) return <Skeleton />;
if (error) return <Alert variant="destructive">{error}</Alert>;
if (empty) return <p>No data. {action}</p>;
return <Success>{data}</Success>;
```

### shadcn/ui Only
```typescript
// ✓ Good
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

// ✗ Bad
<button className="custom-btn">...</button> // самописное
```

### Server Components
```typescript
// ✓ Default (no 'use client')
export default async function DashboardPage() {
  const data = await fetchData();
  return <DashboardContent data={data} />;
}

// ✗ Bad (unless needed)
'use client'; // avoid if not necessary
```

### Forms → Server Actions
```typescript
// ✓ Good
import { analyzeText } from '@/app/actions';

export function AnalyzeForm() {
  return (
    <form action={analyzeText}>
      <input name="text" />
    </form>
  );
}

// ✗ Bad
const [data, setData] = useState(null);
fetch('/api/analyze', { method: 'POST', body }); // use Server Action instead
```

### Accessibility
```typescript
// ✓ Good
<input
  aria-label="Paste text to analyze"
  placeholder="Paste call transcript..."
/>

// ✗ Bad
<input /> // no label
```

## Обязательно

- ✓ Все UI из shadcn/ui
- ✓ 4 states (loading/empty/error/success) на каждом complex component
- ✓ Server Components по умолчанию
- ✓ 'use client' только для interactivity
- ✓ TypeScript (no `any`)
- ✓ Forms используют Server Actions
- ✓ Responsive (mobile works)
- ✓ Semantic HTML
- ✓ ARIA labels на inputs

## Когда говорить "NO"

- "Custom button instead of shadcn/ui Button"
- "No loading state while fetching"
- "Component uses fetch() instead of Server Action"
- "No error state if API fails"
- "Missing ARIA label on input"
- "Not responsive on mobile"
- "Using any in TypeScript"
