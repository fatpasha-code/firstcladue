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
      system: 'Ты -- аналитик, извлекающий структурированные данные из текстов рабочих созвонов и переписок. Весь вывод строго на русском языке. Все поля, описания и значения -- только на русском.\n\nИзвлеки из текста и верни ТОЛЬКО валидный JSON без markdown, без ```json, без пояснений. Строго соблюдай эту структуру:\n{\n  "done": [{"description": "что сделано", "person": "кто (опционально)"}],\n  "in_progress": [{"description": "что в работе", "person": "кто (опционально)", "deadline": "дедлайн (опционально)"}],\n  "blockers": [{"description": "описание блокера", "impact": "high|medium|low"}],\n  "assignments": [{"person": "имя", "tasks": ["задача 1", "задача 2"], "by_when": "срок (опционально)"}],\n  "deadlines": [{"description": "описание", "date": "дата", "type": "explicit|inferred"}]\n}\n\nЕсли информации нет для какой-то категории, верни пустой массив.',
      messages: [{ role: 'user', content: rawText }],
    }).finalMessage()

    const text = message.content[0].type === 'text' ? message.content[0].text : ''
    const json = JSON.parse(text.trim())
    return ExtractedDataSchema.parse(json)
  } catch (error) {
    console.error('[runExtraction] error:', error)
    throw error
  }
}
