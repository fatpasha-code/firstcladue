import Link from 'next/link'
import { StatusBadge } from '@/components/status-badge'

type RecordHeaderProps = {
  record: {
    label: string | null
    created_at: string
    interpretation: { real_status: 'green' | 'yellow' | 'red' } | null
  }
}

function formatDate(dateString: string): string {
  return new Intl.DateTimeFormat('ru-RU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date(dateString))
}

export function RecordHeader({ record }: RecordHeaderProps) {
  const formattedDate = formatDate(record.created_at)

  return (
    <div>
      <Link
        href="/"
        className="text-muted-foreground hover:text-foreground text-sm mb-6 inline-block"
      >
        Назад
      </Link>
      <div className="flex items-center gap-3">
        <h1 className="text-xl font-semibold leading-[1.2]">
          {record.label ? record.label : `Запись от ${formattedDate}`}
        </h1>
        {record.interpretation && (
          <StatusBadge status={record.interpretation.real_status} />
        )}
      </div>
      {record.label && (
        <p className="text-muted-foreground text-sm mt-1">{formattedDate}</p>
      )}
    </div>
  )
}
