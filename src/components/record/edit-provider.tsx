'use client'

import { createContext, useContext, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import type { ExtractedData } from '@/lib/ai/schemas'
import { saveCorrections } from '@/app/actions'

type EditContextType = {
  isEditing: boolean
  editedData: ExtractedData
  startEditing: () => void
  cancelEditing: () => void
  updateField: (path: string, value: string) => void
  isSaving: boolean
  saveError: string | null
  handleSave: () => Promise<void>
}

const EditContext = createContext<EditContextType | null>(null)

export function useEditMode(): EditContextType {
  const ctx = useContext(EditContext)
  if (!ctx) {
    throw new Error('useEditMode must be used within a RecordEditProvider')
  }
  return ctx
}

// Deep immutable set: sets value at dot-separated path inside obj
function setNestedValue(
  obj: unknown,
  pathParts: string[],
  value: string
): unknown {
  if (pathParts.length === 0) return value

  const [head, ...rest] = pathParts
  const index = Number(head)
  const isIndex = !isNaN(index) && String(index) === head

  if (isIndex) {
    const arr = Array.isArray(obj) ? [...obj] : []
    arr[index] = setNestedValue(arr[index], rest, value)
    return arr
  } else {
    const record = (obj !== null && typeof obj === 'object' ? obj : {}) as Record<string, unknown>
    return {
      ...record,
      [head]: setNestedValue(record[head], rest, value),
    }
  }
}

type RecordEditProviderProps = {
  children: React.ReactNode
  recordId: string
  initialData: ExtractedData
}

export function RecordEditProvider({ children, recordId, initialData }: RecordEditProviderProps) {
  const router = useRouter()
  const [isEditing, setIsEditing] = useState(false)
  const [editedData, setEditedData] = useState<ExtractedData>(initialData)
  const [isSaving, setIsSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  function startEditing() {
    setEditedData(JSON.parse(JSON.stringify(initialData)))
    setIsEditing(true)
  }

  function cancelEditing() {
    setIsEditing(false)
    setEditedData(initialData)
    setSaveError(null)
  }

  function updateField(path: string, value: string) {
    const parts = path.split('.')
    setEditedData(prev => setNestedValue(prev, parts, value) as ExtractedData)
  }

  async function handleSave() {
    setIsSaving(true)
    setSaveError(null)
    try {
      const result = await saveCorrections(recordId, editedData)
      if ('error' in result) {
        setSaveError('Не удалось сохранить изменения. Попробуйте ещё раз.')
      } else {
        setIsEditing(false)
        router.refresh()
      }
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <EditContext.Provider
      value={{ isEditing, editedData, startEditing, cancelEditing, updateField, isSaving, saveError, handleSave }}
    >
      {children}
    </EditContext.Provider>
  )
}

export function EditModeControls() {
  const { isEditing, startEditing, cancelEditing, handleSave, isSaving, saveError } = useEditMode()

  return (
    <div>
      <div className="flex items-center gap-2">
        {isEditing ? (
          <>
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? 'Сохранение...' : 'Сохранить'}
            </Button>
            <Button variant="outline" onClick={cancelEditing} disabled={isSaving}>
              Отмена
            </Button>
          </>
        ) : (
          <Button variant="outline" onClick={startEditing}>
            Редактировать
          </Button>
        )}
      </div>
      {saveError && (
        <Alert variant="destructive" className="mt-2">
          <AlertDescription>{saveError}</AlertDescription>
        </Alert>
      )}
    </div>
  )
}
