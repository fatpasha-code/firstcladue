import Anthropic from '@anthropic-ai/sdk'
import { InterpretationSchema, type Interpretation, type ExtractedData } from './schemas'

const client = new Anthropic()

export async function runInterpretation(rawText: string, extractedData: ExtractedData): Promise<Interpretation> {
  const model = process.env.CLAUDE_INTERPRETATION_MODEL
  if (!model) {
    throw new Error('CLAUDE_INTERPRETATION_MODEL env var is not set')
  }

  try {
    const message = await client.messages.stream({
      model,
      max_tokens: 4096,
      system: 'Ты -- управленческий аналитик. Твоя задача -- интерпретировать технические обновления на языке менеджера.\n\nВесь вывод строго на русском языке. Все поля, описания и значения -- только на русском.\n\nНа основе исходного текста и извлечённых данных верни ТОЛЬКО валидный JSON без markdown, без ```json, без пояснений:\n{\n  "summary": "краткое резюме (2-3 предложения)",\n  "management_view": "что это значит для менеджера",\n  "hidden_blockers": ["скрытый блокер"],\n  "ambiguities": ["неясность"],\n  "clarification_questions": ["вопрос"],\n  "real_status": "green|yellow|red"\n}\n\nЕсли скрытых блокеров или неясностей нет, верни пустые массивы.',
      messages: [{ role: 'user', content: 'Исходный текст:\n\n' + rawText + '\n\nИзвлечённые данные:\n\n' + JSON.stringify(extractedData, null, 2) }],
    }).finalMessage()

    const text = message.content[0].type === 'text' ? message.content[0].text : ''
    const json = JSON.parse(text.trim())
    return InterpretationSchema.parse(json)
  } catch (error) {
    console.error('[runInterpretation] error:', error)
    throw error
  }
}
