import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { AnalyzeForm } from '@/components/analyze-form'

export default async function Home() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  return <AnalyzeForm userEmail={user.email || ''} />
}
