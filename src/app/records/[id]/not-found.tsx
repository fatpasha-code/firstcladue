import Link from 'next/link'
import { Alert, AlertDescription } from '@/components/ui/alert'

export default function RecordNotFound() {
  return (
    <div className="mx-auto max-w-4xl px-8 py-8">
      <Link href="/" className="text-muted-foreground hover:text-foreground text-sm mb-6 inline-block">
        Назад
      </Link>
      <Alert>
        <AlertDescription>Запись не найдена.</AlertDescription>
      </Alert>
    </div>
  )
}
