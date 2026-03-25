type StatusBadgeProps = {
  status: 'green' | 'yellow' | 'red'
}

const colorMap: Record<StatusBadgeProps['status'], string> = {
  green: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300',
  yellow: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300',
  red: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
}

const labelMap: Record<StatusBadgeProps['status'], string> = {
  green: 'В порядке',
  yellow: 'Есть вопросы',
  red: 'Требует внимания',
}

export function StatusBadge({ status }: StatusBadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${colorMap[status]}`}
    >
      {labelMap[status]}
    </span>
  )
}
