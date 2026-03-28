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
    type: z.enum(['explicit', 'inferred']),
    condition: z.string().optional()
  }))
})

export const EvidenceSchema = z.object({
  type: z.enum(['quote', 'paraphrase']),
  text: z.string().min(1),
  speaker: z.string().optional(),
  confidence: z.enum(['high', 'medium'])
})

export const GroundedClaimSchema = z.object({
  claim: z.string(),
  evidence: EvidenceSchema
})

export const InterpretationSchema = z.object({
  summary: z.string(),
  management_view: z.string(),
  hidden_blockers: z.array(GroundedClaimSchema),
  ambiguities: z.array(GroundedClaimSchema),
  clarification_questions: z.array(z.string()),
  real_status: z.enum(['green', 'yellow', 'red']),
  real_status_reason: z.string()
})

export type ExtractedData = z.infer<typeof ExtractedDataSchema>
export type Interpretation = z.infer<typeof InterpretationSchema>
export type Evidence = z.infer<typeof EvidenceSchema>
export type GroundedClaim = z.infer<typeof GroundedClaimSchema>
