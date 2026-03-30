type ImpactBadgeProps = {
  impact: 'high' | 'medium' | 'low'
}

const colorMap: Record<ImpactBadgeProps['impact'], string> = {
  high: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
  medium: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300',
  low: 'bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400',
}

const labelMap: Record<ImpactBadgeProps['impact'], string> = {
  high: 'высокий',
  medium: 'средний',
  low: 'низкий',
}

export function ImpactBadge({ impact }: ImpactBadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${colorMap[impact]}`}
    >
      <span className="sr-only">Влияние: </span>
      {labelMap[impact]}
    </span>
  )
}
