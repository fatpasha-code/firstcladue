import Anthropic from '@anthropic-ai/sdk'
import { ExtractedDataSchema, type ExtractedData } from './schemas'

const client = new Anthropic()

export async function runExtraction(rawText: string): Promise<ExtractedData> {
  const model = process.env.CLAUDE_EXTRACTION_MODEL
  if (!model) {
    throw new Error('CLAUDE_EXTRACTION_MODEL env var is not set')
  }

  try {
    const message = await client.messages.stream({
      model,
      max_tokens: 4096,
      // @ts-ignore — proxy-specific: explicitly disable thinking to prevent timeout
      thinking: { type: 'disabled' },
      system: 'Ты -- аналитик, извлекающий структурированные данные из текстов рабочих созвонов и переписок. Весь вывод строго на русском языке. Все поля, описания и значения -- только на русском.\n\nПРАВИЛО КВАЛИФИКАТОРОВ: Если элемент выглядит как завершённый, НО говорящий добавил квалификатор, сигнализирующий что результат не финальный или нестабильный (например: "но не финальная", "пока сырой", "не считаю финальным", "нужно доделать", "временно", "грубо", "на скорую руку"), классифицируй его как `in_progress`, а НЕ как `done`. Квалификатор сигнализирует о продолжающейся работе. Классифицируй как `done` только когда говорящий считает элемент полностью завершённым без оговорок.\n\nПРАВИЛО РАЗДЕЛЕНИЯ: Если говорящий явно называет один завершённый подэтап, а затем отдельно описывает незавершённую смежную работу — это два разных элемента. Сохрани завершённый подэтап в `done`, а незавершённую работу помести в `in_progress` и/или `blockers`. Не коллапсируй всё в `in_progress` из-за того, что следующая фраза описывает проблему в другом месте.\n\nОтличие от ПРАВИЛА КВАЛИФИКАТОРОВ: квалификатор модифицирует тот же самый предмет ("база готова, но не финальная" — один предмет с оговоркой → `in_progress`). Правило разделения применяется когда речь о двух разных предметах ("цепочку дособрал" [один подэтап, done] + "есть проблема на стыке с вебаппом" [другой предмет, in_progress]).\n\nПРАВИЛО ПОКРЫТИЯ: Выяви ВСЕ тематические блоки разговора (например: бэкенд, фронтенд, аналитика, инфраструктура, команда, финансы, продукт). Для каждого блока извлеки хотя бы один элемент, если блок содержит выполняемые действия или информацию о статусе. Не пропускай темы молча. Если тема обсуждалась, но не дала извлекаемых элементов -- это допустимо. Но не пропускай темы с явной информацией о done/in_progress/blocker/assignment/deadline.\n\nИзвлеки из текста и верни ТОЛЬКО валидный JSON без markdown, без ```json, без пояснений. Строго соблюдай эту структуру:\n{\n  "done": [{"description": "что сделано", "person": "кто (опционально)"}],\n  "in_progress": [{"description": "что в работе", "person": "кто (опционально)", "deadline": "дедлайн (опционально)"}],\n  "blockers": [{"description": "описание блокера", "impact": "high|medium|low"}],\n  "assignments": [{"person": "имя", "tasks": ["задача 1", "задача 2"], "by_when": "срок (опционально)"}],\n  "deadlines": [{"description": "описание", "date": "дата", "type": "explicit|inferred"}]\n}\n\nЕсли информации нет для какой-то категории, верни пустой массив.',
      messages: [{ role: 'user', content: rawText }],
    }).finalMessage()

    console.log('[runExtraction] stop_reason:', message.stop_reason)
    console.log('[runExtraction] content blocks:', message.content.length)
    console.log('[runExtraction] content structure:', JSON.stringify(message.content.map(b => ({ type: b.type, len: b.type === 'text' ? b.text.length : 0 }))))
    const textBlock = message.content.find(b => b.type === 'text')
    const text = textBlock?.type === 'text' ? textBlock.text : ''
    console.log('[runExtraction] text length:', text.length)
    console.log('[runExtraction] text preview:', text.slice(0, 300))

    if (!text.trim()) {
      throw new Error(`Empty response from model. stop_reason: ${message.stop_reason}`)
    }

    // Strip markdown fences if model ignored instructions
    const cleaned = text.trim().replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '')
    const json = JSON.parse(cleaned)
    return ExtractedDataSchema.parse(json)
  } catch (error) {
    console.error('[runExtraction] error:', error)
    throw error
  }
}
