import Anthropic from '@anthropic-ai/sdk'
import { zodOutputFormat } from '@anthropic-ai/sdk/helpers/zod'
import { InterpretationSchema, type Interpretation, type ExtractedData } from './schemas'

const client = new Anthropic()

export async function runInterpretation(rawText: string, extractedData: ExtractedData): Promise<Interpretation> {
  const model = process.env.CLAUDE_INTERPRETATION_MODEL
  if (!model) {
    throw new Error('CLAUDE_INTERPRETATION_MODEL env var is not set')
  }

  try {
    const response = await client.messages.parse({
      model,
      max_tokens: 4096,
      system: 'Ты -- управленческий аналитик. Твоя задача -- интерпретировать технические обновления на языке менеджера.\n\nВесь вывод строго на русском языке. Все поля, описания и значения -- только на русском.\n\nНа основе исходного текста и извлечённых данных определи:\n- summary: краткое резюме ситуации (2-3 предложения)\n- management_view: что это значит для менеджера (риски, здоровье задач)\n- hidden_blockers: скрытые блокеры которые не названы явно\n- ambiguities: неясности и расплывчатые формулировки\n- clarification_questions: конкретные вопросы которые стоит задать разработчику\n- real_status: green (всё по плану), yellow (есть вопросы/риски), red (критические проблемы)\n\nЕсли скрытых блокеров или неясностей нет, верни пустые массивы.',
      messages: [{ role: 'user', content: 'Исходный текст:\n\n' + rawText + '\n\nИзвлечённые данные:\n\n' + JSON.stringify(extractedData, null, 2) }],
      output_config: { format: zodOutputFormat(InterpretationSchema) }
    })

    return response.parsed_output as Interpretation
  } catch (error) {
    console.error('[runInterpretation] error:', error)
    throw error
  }
}
