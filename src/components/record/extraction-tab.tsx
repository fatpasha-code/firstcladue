'use client'

import { Calendar } from 'lucide-react'
import type { ExtractedData } from '@/lib/ai/schemas'
import { ImpactBadge } from './impact-badge'
import { InferredBadge } from './inferred-badge'
import { useEditMode } from './edit-provider'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'

type ExtractionTabProps = {
  tab: 'done' | 'in_progress' | 'blockers' | 'assignments' | 'deadlines'
  data: ExtractedData
}

const emptyState = (
  <p className="text-muted-foreground text-sm py-8 text-center">Ничего не найдено</p>
)

export function ExtractionTab({ tab, data }: ExtractionTabProps) {
  const { isEditing, editedData, updateField } = useEditMode()

  // In edit mode, render from editedData; in view mode, render from data prop
  const displayData = isEditing ? editedData : data

  if (tab === 'done') {
    if (displayData.done.length === 0) return emptyState
    return (
      <ul>
        {displayData.done.map((item, i) => (
          <li key={i} className="py-3 border-b last:border-b-0">
            {isEditing ? (
              <div className="space-y-2">
                <div>
                  <Label htmlFor={`done-${i}-desc`} className="sr-only">Описание</Label>
                  <Textarea
                    id={`done-${i}-desc`}
                    className="min-h-[60px] text-sm"
                    value={item.description}
                    onChange={e => updateField(`done.${i}.description`, e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor={`done-${i}-person`} className="sr-only">Ответственный</Label>
                  <Input
                    id={`done-${i}-person`}
                    className="text-sm"
                    value={item.person ?? ''}
                    onChange={e => updateField(`done.${i}.person`, e.target.value)}
                    placeholder="Ответственный"
                  />
                </div>
              </div>
            ) : (
              <>
                <p className="text-sm leading-relaxed">{item.description}</p>
                {item.person && (
                  <span className="text-muted-foreground text-xs ml-2">{item.person}</span>
                )}
              </>
            )}
          </li>
        ))}
      </ul>
    )
  }

  if (tab === 'in_progress') {
    if (displayData.in_progress.length === 0) return emptyState
    return (
      <ul>
        {displayData.in_progress.map((item, i) => (
          <li key={i} className="py-3 border-b last:border-b-0">
            {isEditing ? (
              <div className="space-y-2">
                <div>
                  <Label htmlFor={`in_progress-${i}-desc`} className="sr-only">Описание</Label>
                  <Textarea
                    id={`in_progress-${i}-desc`}
                    className="min-h-[60px] text-sm"
                    value={item.description}
                    onChange={e => updateField(`in_progress.${i}.description`, e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor={`in_progress-${i}-person`} className="sr-only">Ответственный</Label>
                  <Input
                    id={`in_progress-${i}-person`}
                    className="text-sm"
                    value={item.person ?? ''}
                    onChange={e => updateField(`in_progress.${i}.person`, e.target.value)}
                    placeholder="Ответственный"
                  />
                </div>
                <div>
                  <Label htmlFor={`in_progress-${i}-deadline`} className="sr-only">Дедлайн</Label>
                  <Input
                    id={`in_progress-${i}-deadline`}
                    className="text-sm"
                    value={item.deadline ?? ''}
                    onChange={e => updateField(`in_progress.${i}.deadline`, e.target.value)}
                    placeholder="Дедлайн"
                  />
                </div>
              </div>
            ) : (
              <>
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
              </>
            )}
          </li>
        ))}
      </ul>
    )
  }

  if (tab === 'blockers') {
    if (displayData.blockers.length === 0) return emptyState
    return (
      <ul>
        {displayData.blockers.map((item, i) => (
          <li key={i} className="py-3 border-b last:border-b-0 flex items-start gap-2">
            {/* impact is read-only per D-11 — enum not editable */}
            <span className={isEditing ? 'opacity-60' : undefined}>
              <ImpactBadge impact={item.impact} />
            </span>
            {isEditing ? (
              <div className="flex-1">
                <Label htmlFor={`blockers-${i}-desc`} className="sr-only">Описание</Label>
                <Textarea
                  id={`blockers-${i}-desc`}
                  className="min-h-[60px] text-sm"
                  value={item.description}
                  onChange={e => updateField(`blockers.${i}.description`, e.target.value)}
                />
              </div>
            ) : (
              <p className="text-sm leading-relaxed">{item.description}</p>
            )}
          </li>
        ))}
      </ul>
    )
  }

  if (tab === 'assignments') {
    if (displayData.assignments.length === 0) return emptyState
    return (
      <ul>
        {displayData.assignments.map((assignment, i) => (
          <li key={i} className="py-3 border-b last:border-b-0">
            {isEditing ? (
              <div className="space-y-2">
                <div>
                  <Label htmlFor={`assignments-${i}-person`} className="sr-only">Имя</Label>
                  <Input
                    id={`assignments-${i}-person`}
                    className="text-sm font-semibold"
                    value={assignment.person}
                    onChange={e => updateField(`assignments.${i}.person`, e.target.value)}
                    placeholder="Имя"
                  />
                </div>
                <ul className="space-y-1 mt-1">
                  {assignment.tasks.map((task, j) => (
                    <li key={j}>
                      <Label htmlFor={`assignments-${i}-task-${j}`} className="sr-only">
                        Задача {j + 1}
                      </Label>
                      <Input
                        id={`assignments-${i}-task-${j}`}
                        className="text-sm"
                        value={task}
                        onChange={e => updateField(`assignments.${i}.tasks.${j}`, e.target.value)}
                        placeholder={`Задача ${j + 1}`}
                      />
                    </li>
                  ))}
                </ul>
                <div>
                  <Label htmlFor={`assignments-${i}-by_when`} className="sr-only">Срок</Label>
                  <Input
                    id={`assignments-${i}-by_when`}
                    className="text-sm"
                    value={assignment.by_when ?? ''}
                    onChange={e => updateField(`assignments.${i}.by_when`, e.target.value)}
                    placeholder="Срок"
                  />
                </div>
              </div>
            ) : (
              <>
                <h3 className="text-sm font-semibold leading-[1.4]">{assignment.person}</h3>
                <ul className="mt-1">
                  {assignment.tasks.map((task, j) => (
                    <li key={j} className="text-sm leading-relaxed">{task}</li>
                  ))}
                </ul>
                {assignment.by_when && (
                  <p className="text-muted-foreground text-xs mt-1">{assignment.by_when}</p>
                )}
              </>
            )}
          </li>
        ))}
      </ul>
    )
  }

  if (tab === 'deadlines') {
    if (displayData.deadlines.length === 0) return emptyState
    return (
      <ul>
        {displayData.deadlines.map((item, i) => (
          <li key={i} className="py-3 border-b last:border-b-0">
            {isEditing ? (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="flex-1">
                    <Label htmlFor={`deadlines-${i}-date`} className="sr-only">Дата</Label>
                    <Input
                      id={`deadlines-${i}-date`}
                      className="text-sm font-semibold"
                      value={item.date}
                      onChange={e => updateField(`deadlines.${i}.date`, e.target.value)}
                      placeholder="Дата"
                    />
                  </div>
                  {/* type is read-only per D-11 — enum not editable */}
                  {item.type === 'inferred' && (
                    <span className="opacity-60">
                      <InferredBadge />
                    </span>
                  )}
                </div>
                <div>
                  <Label htmlFor={`deadlines-${i}-desc`} className="sr-only">Описание</Label>
                  <Textarea
                    id={`deadlines-${i}-desc`}
                    className="min-h-[60px] text-sm"
                    value={item.description}
                    onChange={e => updateField(`deadlines.${i}.description`, e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor={`deadlines-${i}-condition`} className="sr-only">Условие</Label>
                  <Input
                    id={`deadlines-${i}-condition`}
                    className="text-sm"
                    value={item.condition ?? ''}
                    onChange={e => updateField(`deadlines.${i}.condition`, e.target.value)}
                    placeholder="Условие"
                  />
                </div>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold">{item.date}</span>
                  {item.type === 'inferred' && <InferredBadge />}
                </div>
                <p className="text-sm leading-relaxed mt-1">{item.description}</p>
                {item.condition && (
                  <p className="text-muted-foreground text-xs mt-1">{item.condition}</p>
                )}
              </>
            )}
          </li>
        ))}
      </ul>
    )
  }

  return emptyState
}
