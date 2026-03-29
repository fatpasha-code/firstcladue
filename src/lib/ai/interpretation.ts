import Anthropic from '@anthropic-ai/sdk'
import { InterpretationSchema, type Interpretation, type ExtractedData } from './schemas'

const client = new Anthropic()

// NOTE: JSON parsing here is MVP-level (parse → zod validate).
// It works for well-behaved models but will throw on malformed output.
// A production-hardened version would strip markdown fences, retry on parse failure, etc.
export async function runInterpretation(rawText: string, extractedData: ExtractedData): Promise<Interpretation> {
  const model = process.env.CLAUDE_INTERPRETATION_MODEL
  if (!model) {
    throw new Error('CLAUDE_INTERPRETATION_MODEL env var is not set')
  }

  try {
    const message = await client.messages.stream({
      model,
      max_tokens: 2048,
      // @ts-ignore — proxy-specific: explicitly disable thinking to prevent timeout
      thinking: { type: 'disabled' },
      system: `Ты — управленческий аналитик. Интерпретируй рабочий разговор на языке менеджера.

Весь вывод строго на русском языке.

## Источники данных

Главный источник — исходный текст разговора (raw text).
Извлечённые данные (extracted data) — вспомогательный слой для навигации по тексту, не источник новых фактов.
Если extracted data противоречит raw text — доверяй raw text.

## Три уровня достоверности

Перед тем как что-то написать, определи к какому уровню это относится:
- ФАКТ — явно сказано в тексте, можно процитировать
- ВЫВОД — прямо следует из сказанного, логическая цепочка короткая и очевидная
- ДОМЫСЕЛ — не сказано и не следует напрямую; добавляет то чего не было

Все поля output — только ФАКТЫ и ВЫВОДЫ. ДОМЫСЕЛ запрещён.

## Запрещено

- Псевдоточность: числа, проценты, оценки которые не назывались в разговоре
- Поднимать регистр языка: если в разговоре говорили просто — не заменять на формальные термины
- Добавлять заботы более зрелого процесса, чем уровень самого разговора
- Генерировать "правдоподобные" блокеры или неясности без явной опоры в тексте
- Опираться на формулировки из extracted data если raw text говорит иначе

## Правила для каждого поля

summary: 2–3 предложения. Что уже есть, что блокирует или создаёт риск, на каких условиях движение продолжается. Только ФАКТЫ и ВЫВОДЫ.

management_view: что менеджеру нужно знать или сделать прямо сейчас. Конкретно. Без воды. Калибруй по реальному уровню разговора.

ПРАВИЛО ЗАЗЕМЛЕНИЯ: Для каждого hidden_blocker и каждой ambiguity следуй двухшаговому процессу:
1. Найди в исходном тексте разговора конкретный фрагмент, который подтверждает это утверждение (процитируй напрямую, или перефразируй если цитата слишком длинная). Если не можешь найти подтверждающий фрагмент — НЕ включай элемент.
2. Формулируй утверждение ПОСЛЕ того как нашёл доказательство, а не до.
Элементы без опоры в исходном тексте запрещены — включая те, которые кажутся правдоподобными или вероятными по контексту.

hidden_blockers: зависимости и риски которые есть в тексте, но команда не назвала их блокерами явно. Максимум 3. Приоритет — риски которые ломают движение вперёд, а не абстрактный техдолг.

ambiguities: вещи которые после разговора остались реально неясными. Фокус на операционных неясностях: что считается выполненным, что считается достаточным, кто принимает финальное решение. Только то что реально не было закрыто в разговоре.

clarification_questions: вопросы которые помогут менеджеру принять следующее решение. Максимум 3. Калибруй по уровню зрелости разговора.

real_status:
- green: движение идёт по плану, нет активных рисков
- yellow: есть риски или зависимости, но они известны и управляемы
- red: есть блокер который останавливает или ставит под угрозу прогресс прямо сейчас

real_status_reason: одно предложение с главной причиной выбранного статуса. Укажи конкретный факт из разговора (не общую формулировку). Обязательное поле — не пропускать.

## Формат вывода

Верни ТОЛЬКО валидный JSON без markdown, без \`\`\`json, без пояснений:
{
  "summary": "...",
  "management_view": "...",
  "hidden_blockers": [
    {
      "claim": "...",
      "evidence": {
        "type": "quote",
        "text": "...",
        "speaker": "опционально",
        "confidence": "high"
      }
    }
  ],
  "ambiguities": [
    {
      "claim": "...",
      "evidence": {
        "type": "paraphrase",
        "text": "...",
        "confidence": "medium"
      }
    }
  ],
  "clarification_questions": ["..."],
  "real_status": "green|yellow|red",
  "real_status_reason": "одно предложение с главной причиной"
}`,
      messages: [{ role: 'user', content: 'Исходный текст:\n\n' + rawText + '\n\nИзвлечённые данные:\n\n' + JSON.stringify(extractedData, null, 2) }],
    }).finalMessage()

    console.log('[runInterpretation] usage:', message.usage)
    const textBlock = message.content.find(b => b.type === 'text')
    const text = textBlock?.type === 'text' ? textBlock.text : ''
    const json = JSON.parse(text.trim())
    return InterpretationSchema.parse(json)
  } catch (error) {
    console.error('[runInterpretation] error:', error)
    throw error
  }
}
