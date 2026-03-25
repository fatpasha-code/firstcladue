'use client'

import { useState } from 'react'
import { saveRecord, extractRecord, interpretRecord, signOut } from '@/app/actions'
import { StatusBadge } from '@/components/status-badge'
import type { Interpretation } from '@/lib/ai/schemas'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert'
import { Textarea } from '@/components/ui/textarea'

type AnalyzeFormProps = {
  userEmail: string
}

export function AnalyzeForm({ userEmail }: AnalyzeFormProps) {
  const [rawText, setRawText] = useState('')
  const [label, setLabel] = useState('')
  const [stage, setStage] = useState('')
  const [error, setError] = useState('')
  const [result, setResult] = useState<{
    id: string
    interpretation: Interpretation
  } | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setResult(null)
    setIsSubmitting(true)

    try {
      // Step 1: Save
      setStage('Сохраняем запись...')
      const saveResult = await saveRecord(rawText, label || undefined)
      if ('error' in saveResult) {
        setError(saveResult.error)
        return
      }

      // Step 2: Extract
      setStage('Извлекаем данные...')
      const extractResult = await extractRecord(saveResult.id)
      if ('error' in extractResult) {
        setError(extractResult.error)
        return
      }

      // Step 3: Interpret
      setStage('Интерпретируем...')
      const interpretResult = await interpretRecord(saveResult.id)
      if ('error' in interpretResult) {
        setError(interpretResult.error)
        return
      }

      // Done
      setStage('Готово')
      setResult({
        id: interpretResult.id,
        interpretation: interpretResult.interpretation,
      })
      setRawText('')
      setLabel('')
    } finally {
      setIsSubmitting(false)
      setTimeout(() => setStage(''), 1000)
    }
  }

  function handleTextareaKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault()
      const form = e.currentTarget.closest('form')
      if (form) form.requestSubmit()
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center px-4 py-12">
      <div className="w-full max-w-2xl space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-semibold">Update Tracker</h1>
          <p className="text-muted-foreground">{userEmail}</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Новый анализ</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="raw-text">Текст для анализа</Label>
                <Textarea
                  id="raw-text"
                  aria-label="Текст для анализа"
                  placeholder="Вставьте текст созвона, переписки или заметок..."
                  rows={8}
                  className="max-h-[400px] overflow-y-auto"
                  value={rawText}
                  onChange={(e) => setRawText(e.target.value)}
                  onKeyDown={handleTextareaKeyDown}
                  disabled={isSubmitting}
                />
                <p className="text-right text-xs text-muted-foreground">
                  {rawText.length.toLocaleString('ru-RU')} / 50 000
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="record-label">Метка (необязательно)</Label>
                <Input
                  id="record-label"
                  aria-label="Метка записи"
                  placeholder="Например: созвон с командой 24.03"
                  value={label}
                  onChange={(e) => setLabel(e.target.value)}
                  disabled={isSubmitting}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') e.preventDefault()
                  }}
                />
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={
                  isSubmitting ||
                  rawText.trim().length === 0 ||
                  rawText.length > 50000
                }
              >
                {isSubmitting ? 'Анализируем...' : 'Анализировать'}
              </Button>

              {stage && (
                <p className="text-center text-sm text-muted-foreground animate-pulse">
                  {stage}
                </p>
              )}
            </form>
          </CardContent>
        </Card>

        {error && (
          <Alert variant="destructive">
            <AlertTitle>Не удалось выполнить анализ</AlertTitle>
            <AlertDescription>
              {error}. Попробуйте ещё раз. Если ошибка повторяется -- проверьте
              текст и попробуйте позже.
            </AlertDescription>
          </Alert>
        )}

        {result && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Результат анализа</CardTitle>
              <StatusBadge status={result.interpretation.real_status} />
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm">
                {result.interpretation.summary ||
                  'Анализ завершён, но интерпретация не содержит текста.'}
              </p>
              <a
                href={`/records/${result.id}`}
                className="text-sm underline text-primary hover:text-primary/80"
              >
                Открыть запись
              </a>
            </CardContent>
          </Card>
        )}

        <form action={signOut} className="text-center">
          <Button type="submit" variant="outline">
            Выйти
          </Button>
        </form>
      </div>
    </div>
  )
}
