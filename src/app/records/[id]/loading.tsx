import { Skeleton } from '@/components/ui/skeleton'

export default function RecordLoading() {
  return (
    <div className="mx-auto max-w-4xl px-8 py-8">
      <Skeleton className="h-4 w-16 mb-6" />
      <div className="mb-12">
        <Skeleton className="h-7 w-64 mb-2" />
        <Skeleton className="h-4 w-40" />
      </div>
      <Skeleton className="h-8 w-full mb-4" />
      <Skeleton className="h-64 w-full rounded-xl" />
    </div>
  )
}
