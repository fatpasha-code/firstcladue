'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { runExtraction } from '@/lib/ai/extraction'
import { runInterpretation } from '@/lib/ai/interpretation'
import { ExtractedDataSchema } from '@/lib/ai/schemas'
import type { Interpretation } from '@/lib/ai/schemas'

export async function saveCorrections(
  recordId: string,
  corrections: unknown
): Promise<{ success: true } | { error: string }> {
  if (!recordId || typeof recordId !== 'string') {
    return { error: 'Некорректный ID записи' }
  }

  const parsed = ExtractedDataSchema.safeParse(corrections)
  if (!parsed.success) {
    return { error: 'Некорректные данные' }
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Не авторизован' }
  }

  try {
    const { error } = await supabase
      .from('records')
      .update({
        user_corrections: parsed.data,
        updated_at: new Date().toISOString(),
      })
      .eq('id', recordId)
      .eq('user_id', user.id)

    if (error) {
      console.error('[saveCorrections] error:', error)
      return { error: 'Не удалось сохранить изменения' }
    }

    return { success: true }
  } catch (error) {
    console.error('[saveCorrections] error:', error)
    return { error: 'Не удалось сохранить изменения' }
  }
}

export async function signOut() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/login')
}

export async function saveRecord(
  rawText: string,
  label?: string
): Promise<{ id: string } | { error: string }> {
  if (!rawText || rawText.trim().length === 0) {
    return { error: 'Вставьте текст для анализа' }
  }
  if (rawText.length > 50_000) {
    return { error: 'Текст превышает лимит в 50 000 символов' }
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Не авторизован' }
  }

  try {
    const { data: record, error: insertError } = await supabase
      .from('records')
      .insert({
        user_id: user.id,
        raw_text: rawText,
        label: label || null,
        status: 'pending',
      })
      .select('id')
      .single()

    if (insertError || !record) {
      console.error('[saveRecord] insert error:', insertError)
      return { error: 'Не удалось сохранить запись' }
    }

    return { id: record.id }
  } catch (error) {
    console.error('[saveRecord] error:', error)
    return { error: 'Не удалось сохранить запись' }
  }
}

export async function extractRecord(
  recordId: string
): Promise<{ success: true } | { error: string }> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Не авторизован' }
  }

  try {
    const { data: record, error: fetchError } = await supabase
      .from('records')
      .select('id, raw_text')
      .eq('id', recordId)
      .eq('user_id', user.id)
      .single()

    if (fetchError || !record) {
      return { error: 'Запись не найдена' }
    }

    await supabase
      .from('records')
      .update({ status: 'processing' })
      .eq('id', recordId)

    const extractedData = await runExtraction(record.raw_text)

    await supabase
      .from('records')
      .update({ extracted_data: extractedData })
      .eq('id', recordId)

    return { success: true }
  } catch (error) {
    console.error('[extractRecord] error:', error)
    await supabase
      .from('records')
      .update({ status: 'failed', error_message: 'Ошибка извлечения данных' })
      .eq('id', recordId)
    return { error: 'Не удалось извлечь данные' }
  }
}

export async function interpretRecord(
  recordId: string
): Promise<{ id: string; interpretation: Interpretation } | { error: string }> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Не авторизован' }
  }

  try {
    const { data: record, error: fetchError } = await supabase
      .from('records')
      .select('id, raw_text, extracted_data')
      .eq('id', recordId)
      .eq('user_id', user.id)
      .single()

    if (fetchError || !record) {
      return { error: 'Запись не найдена' }
    }

    if (!record.extracted_data) {
      return { error: 'Извлечённые данные отсутствуют' }
    }

    const interpretation = await runInterpretation(
      record.raw_text,
      record.extracted_data
    )

    await supabase
      .from('records')
      .update({
        interpretation,
        status: 'completed',
        updated_at: new Date().toISOString(),
      })
      .eq('id', recordId)

    return { id: recordId, interpretation }
  } catch (error) {
    console.error('[interpretRecord] error:', error)
    await supabase
      .from('records')
      .update({
        status: 'failed',
        error_message: 'Ошибка интерпретации',
      })
      .eq('id', recordId)
    return { error: 'Не удалось выполнить интерпретацию' }
  }
}
