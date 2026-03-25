'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export async function login(formData: FormData) {
  const email = String(formData.get('email') ?? '').trim()
  const password = String(formData.get('password') ?? '')

  // Input validation first (per CLAUDE.md API rules)
  if (!email) {
    return { error: 'Email is required' }
  }
  if (!password) {
    return { error: 'Password is required' }
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithPassword({ email, password })

  if (error) {
    return { error: 'Invalid email or password' } // Don't expose internal error details
  }

  redirect('/')
}

export async function resetPassword(formData: FormData) {
  const email = String(formData.get('email') ?? '').trim()

  if (!email) {
    return { error: 'Email is required' }
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/confirm?next=/reset-password`,
  })

  if (error) {
    // Don't reveal whether email exists
    console.error('[resetPassword] error:', error)
  }

  // Always show success message (security: don't reveal if email exists)
  return { success: true }
}
