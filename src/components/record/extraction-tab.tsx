'use client'

import { Calendar } from 'lucide-react'
import type { ExtractedData } from '@/lib/ai/schemas'
import { ImpactBadge } from './impact-badge'
import { InferredBadge } from './inferred-badge'

type ExtractionTabProps = {
  tab: 'done' | 'in_progress' | 'blockers' | 'assignments' | 'deadlines'
  data: ExtractedData
}

const emptyState = (
  <p className="text-muted-foreground text-sm py-8 text-center">Ничего не найдено</p>
)

export function ExtractionTab({ tab, data }: ExtractionTabProps) {
  if (tab === 'done') {
    if (data.done.length === 0) return emptyState
    return (
      <ul>
        {data.done.map((item, i) => (
          <li key={i} className="py-3 border-b last:border-b-0">
            <p className="text-sm leading-relaxed">{item.description}</p>
            {item.person && (
              <span className="text-muted-foreground text-xs ml-2">{item.person}</span>
            )}
          </li>
        ))}
      </ul>
    )
  }

  if (tab === 'in_progress') {
    if (data.in_progress.length === 0) return emptyState
    return (
      <ul>
        {data.in_progress.map((item, i) => (
          <li key={i} className="py-3 border-b last:border-b-0">
            <p className="text-sm leading-relaxed">{item.description}</p>
            {item.person && (
              <span className="text-muted-foreground text-xs block mt-1">{item.person}</span>
            )}
            {item.deadline && (
              <span className="text-muted-foreground text-xs flex items-center mt-1">
                <Calendar className="inline h-3.5 w-3.5 mr-1" />
                {item.deadline}
              </span>
            )}
          </li>
        ))}
      </ul>
    )
  }

  if (tab === 'blockers') {
    if (data.blockers.length === 0) return emptyState
    return (
      <ul>
        {data.blockers.map((item, i) => (
          <li key={i} className="py-3 border-b last:border-b-0 flex items-start gap-2">
            <ImpactBadge impact={item.impact} />
            <p className="text-sm leading-relaxed">{item.description}</p>
          </li>
        ))}
      </ul>
    )
  }

  if (tab === 'assignments') {
    if (data.assignments.length === 0) return emptyState
    return (
      <ul>
        {data.assignments.map((assignment, i) => (
          <li key={i} className="py-3 border-b last:border-b-0">
            <h3 className="text-sm font-semibold leading-[1.4]">{assignment.person}</h3>
            <ul className="mt-1">
              {assignment.tasks.map((task, j) => (
                <li key={j} className="text-sm leading-relaxed">{task}</li>
              ))}
            </ul>
            {assignment.by_when && (
              <p className="text-muted-foreground text-xs mt-1">{assignment.by_when}</p>
            )}
          </li>
        ))}
      </ul>
    )
  }

  if (tab === 'deadlines') {
    if (data.deadlines.length === 0) return emptyState
    return (
      <ul>
        {data.deadlines.map((item, i) => (
          <li key={i} className="py-3 border-b last:border-b-0">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold">{item.date}</span>
              {item.type === 'inferred' && <InferredBadge />}
            </div>
            <p className="text-sm leading-relaxed mt-1">{item.description}</p>
            {item.condition && (
              <p className="text-muted-foreground text-xs mt-1">{item.condition}</p>
            )}
          </li>
        ))}
      </ul>
    )
  }

  return emptyState
}
