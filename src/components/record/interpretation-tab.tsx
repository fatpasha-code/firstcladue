'use client'

import type { Interpretation } from '@/lib/ai/schemas'
import { StatusBadge } from '@/components/status-badge'
import { EvidenceCollapsible } from './evidence-collapsible'

type InterpretationTabProps = {
  interpretation: Interpretation | null
}

const emptyState = (
  <p className="text-muted-foreground text-sm py-4 text-center">Ничего не найдено</p>
)

export function InterpretationTab({ interpretation }: InterpretationTabProps) {
  if (!interpretation) {
    return (
      <p className="text-muted-foreground text-sm py-8 text-center">
        Интерпретация недоступна
      </p>
    )
  }

  return (
    <div className="space-y-6">
      {/* 1. Статус */}
      <section>
        <h2 className="text-xl font-semibold leading-[1.2] mb-2">Статус</h2>
        <StatusBadge status={interpretation.real_status} />
        <p className="text-sm leading-relaxed mt-2">{interpretation.real_status_reason}</p>
      </section>

      {/* 2. Резюме */}
      <section>
        <h2 className="text-xl font-semibold leading-[1.2] mb-2">Резюме</h2>
        <p className="text-sm leading-relaxed">{interpretation.summary}</p>
      </section>

      {/* 3. Управленческий взгляд */}
      <section>
        <h2 className="text-xl font-semibold leading-[1.2] mb-2">Управленческий взгляд</h2>
        <p className="text-sm leading-relaxed">{interpretation.management_view}</p>
      </section>

      {/* 4. Скрытые блокеры */}
      <section>
        <h2 className="text-xl font-semibold leading-[1.2] mb-2">Скрытые блокеры</h2>
        {interpretation.hidden_blockers.length === 0 ? (
          emptyState
        ) : (
          <div>
            {interpretation.hidden_blockers.map((item, i) => (
              <EvidenceCollapsible key={i} claim={item} />
            ))}
          </div>
        )}
      </section>

      {/* 5. Неясности */}
      <section>
        <h2 className="text-xl font-semibold leading-[1.2] mb-2">Неясности</h2>
        {interpretation.ambiguities.length === 0 ? (
          emptyState
        ) : (
          <div>
            {interpretation.ambiguities.map((item, i) => (
              <EvidenceCollapsible key={i} claim={item} />
            ))}
          </div>
        )}
      </section>

      {/* 6. Что уточнить */}
      <section>
        <h2 className="text-xl font-semibold leading-[1.2] mb-2">Что уточнить</h2>
        {interpretation.clarification_questions.length === 0 ? (
          emptyState
        ) : (
          <ol className="list-decimal list-inside space-y-2">
            {interpretation.clarification_questions.map((question, i) => (
              <li key={i} className="text-sm leading-relaxed">{question}</li>
            ))}
          </ol>
        )}
      </section>
    </div>
  )
}
