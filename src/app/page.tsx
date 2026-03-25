import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { signOut } from './actions'
import { Button } from '@/components/ui/button'

export default async function Home() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4">
      <h1 className="text-2xl font-semibold">Update Tracker</h1>
      <p className="text-muted-foreground">{user.email}</p>
      <form action={signOut}>
        <Button type="submit" variant="outline">
          Sign Out
        </Button>
      </form>
    </main>
  )
}
