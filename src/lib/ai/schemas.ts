import { z } from 'zod'

export const ExtractedDataSchema = z.object({
  done: z.array(z.object({
    description: z.string(),
    person: z.string().optional()
  })),
  in_progress: z.array(z.object({
    description: z.string(),
    person: z.string().optional(),
    deadline: z.string().optional()
  })),
  blockers: z.array(z.object({
    description: z.string(),
    impact: z.enum(['high', 'medium', 'low'])
  })),
  assignments: z.array(z.object({
    person: z.string(),
    tasks: z.array(z.string()),
    by_when: z.string().optional()
  })),
  deadlines: z.array(z.object({
    date: z.string(),
    description: z.string(),
    type: z.enum(['explicit', 'inferred'])
  }))
})

export const InterpretationSchema = z.object({
  summary: z.string(),
  management_view: z.string(),
  hidden_blockers: z.array(z.string()),
  ambiguities: z.array(z.string()),
  clarification_questions: z.array(z.string()),
  real_status: z.enum(['green', 'yellow', 'red'])
})

export type ExtractedData = z.infer<typeof ExtractedDataSchema>
export type Interpretation = z.infer<typeof InterpretationSchema>
