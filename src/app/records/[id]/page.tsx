import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ExtractedDataSchema, InterpretationSchema } from '@/lib/ai/schemas'
import { RecordHeader } from '@/components/record/record-header'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Card, CardContent } from '@/components/ui/card'
import { ExtractionTab } from '@/components/record/extraction-tab'
import { InterpretationTab } from '@/components/record/interpretation-tab'

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
        <Tabs defaultValue="done" className="w-full">
          <TabsList>
            <TabsTrigger value="done">Сделано</TabsTrigger>
            <TabsTrigger value="in_progress">В работе</TabsTrigger>
            <TabsTrigger value="blockers">Блокеры</TabsTrigger>
            <TabsTrigger value="assignments">Назначения</TabsTrigger>
            <TabsTrigger value="deadlines">Дедлайны</TabsTrigger>
            <TabsTrigger value="interpretation">Интерпретация</TabsTrigger>
          </TabsList>
          <Card className="mt-4">
            <CardContent className="p-6">
              <TabsContent value="done" className="mt-0">
                <ExtractionTab tab="done" data={displayData} />
              </TabsContent>
              <TabsContent value="in_progress" className="mt-0">
                <ExtractionTab tab="in_progress" data={displayData} />
              </TabsContent>
              <TabsContent value="blockers" className="mt-0">
                <ExtractionTab tab="blockers" data={displayData} />
              </TabsContent>
              <TabsContent value="assignments" className="mt-0">
                <ExtractionTab tab="assignments" data={displayData} />
              </TabsContent>
              <TabsContent value="deadlines" className="mt-0">
                <ExtractionTab tab="deadlines" data={displayData} />
              </TabsContent>
              <TabsContent value="interpretation" className="mt-0">
                <InterpretationTab interpretation={interpretation} />
              </TabsContent>
            </CardContent>
          </Card>
        </Tabs>
      </div>
    </div>
  )
}
