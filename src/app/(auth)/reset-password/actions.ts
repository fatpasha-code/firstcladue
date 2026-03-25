'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export async function updatePassword(formData: FormData) {
  const password = String(formData.get('password') ?? '')
  const confirmPassword = String(formData.get('confirmPassword') ?? '')

  if (!password || password.length < 6) {
    return { error: 'Password must be at least 6 characters' }
  }
  if (password !== confirmPassword) {
    return { error: 'Passwords do not match' }
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.updateUser({ password })

  if (error) {
    return { error: 'Failed to update password. Please try again.' }
  }

  redirect('/')
}
