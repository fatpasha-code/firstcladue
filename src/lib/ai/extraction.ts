import Anthropic from '@anthropic-ai/sdk'
import { zodOutputFormat } from '@anthropic-ai/sdk/helpers/zod'
import { ExtractedDataSchema, type ExtractedData } from './schemas'

const client = new Anthropic()

export async function runExtraction(rawText: string): Promise<ExtractedData> {
  const model = process.env.CLAUDE_EXTRACTION_MODEL
  if (!model) {
    throw new Error('CLAUDE_EXTRACTION_MODEL env var is not set')
  }

  try {
    const response = await client.messages.parse({
      model,
      max_tokens: 4096,
      system: 'Ты -- аналитик, извлекающий структурированные данные из текстов рабочих созвонов и переписок. Весь вывод строго на русском языке. Все поля, описания и значения -- только на русском.\n\nИзвлеки из текста:\n- done: что завершено\n- in_progress: что в работе\n- blockers: блокеры и их уровень влияния (high/medium/low)\n- assignments: кто за что отвечает и к какому сроку\n- deadlines: явные (explicit) и выведенные из контекста (inferred) дедлайны\n\nЕсли информации нет для какой-то категории, верни пустой массив.',
      messages: [{ role: 'user', content: rawText }],
      output_config: { format: zodOutputFormat(ExtractedDataSchema) }
    })

    return response.parsed_output as ExtractedData
  } catch (error) {
    console.error('[runExtraction] error:', error)
    throw error
  }
}
