import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ExtractedDataSchema, InterpretationSchema } from '@/lib/ai/schemas'
import { RecordHeader } from '@/components/record/record-header'

export default async function RecordPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: record, error } = await supabase
    .from('records')
    .select('id, label, status, extracted_data, user_corrections, interpretation, created_at')
    .eq('id', id)
    .single()

  if (error || !record) {
    notFound()
  }

  let displayData
  try {
    displayData = ExtractedDataSchema.parse(record.user_corrections ?? record.extracted_data)
  } catch {
    return (
      <div className="mx-auto max-w-4xl px-8 py-8">
        <RecordHeader record={record} />
        <p className="text-muted-foreground text-sm mt-8">
          Не удалось загрузить данные записи. Попробуйте обновить страницу.
        </p>
      </div>
    )
  }

  let interpretation = null
  try {
    if (record.interpretation) {
      interpretation = InterpretationSchema.parse(record.interpretation)
    }
  } catch {
    // interpretation parsing failed — render page without it
  }

  return (
    <div className="mx-auto max-w-4xl px-8 py-8">
      <RecordHeader record={record} />
      <div className="mt-12">
        {/* Tabs wired in Task 2 */}
        <p className="text-muted-foreground text-sm">Загрузка вкладок...</p>
      </div>
    </div>
  )
}
