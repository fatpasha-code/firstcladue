'use client'

import { useState } from 'react'
import { login, resetPassword } from './actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export function LoginForm() {
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [resetSent, setResetSent] = useState(false)
  const [showResetForm, setShowResetForm] = useState(false)

  async function handleLogin(formData: FormData) {
    setError(null)
    setLoading(true)
    const result = await login(formData)
    // If login succeeds, redirect happens server-side
    // If it fails, we get an error back
    if (result?.error) {
      setError(result.error)
    }
    setLoading(false)
  }

  async function handleResetPassword(formData: FormData) {
    setError(null)
    const result = await resetPassword(formData)
    if (result?.success) {
      setResetSent(true)
    }
    if (result?.error) {
      setError(result.error)
    }
  }

  if (showResetForm) {
    return (
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Reset Password</CardTitle>
        </CardHeader>
        <CardContent>
          {resetSent ? (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Check your email for a reset link.
              </p>
              <button
                type="button"
                onClick={() => {
                  setShowResetForm(false)
                  setResetSent(false)
                  setError(null)
                }}
                className="text-sm text-muted-foreground underline"
              >
                Back to login
              </button>
            </div>
          ) : (
            <form action={handleResetPassword} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="reset-email">Email</Label>
                <Input
                  id="reset-email"
                  name="email"
                  type="email"
                  required
                  aria-label="Email address for password reset"
                />
              </div>
              {error && (
                <p className="text-sm text-destructive">{error}</p>
              )}
              <Button type="submit" className="w-full">
                Send Reset Link
              </Button>
              <button
                type="button"
                onClick={() => {
                  setShowResetForm(false)
                  setError(null)
                }}
                className="text-sm text-muted-foreground underline"
              >
                Back to login
              </button>
            </form>
          )}
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle>Sign In</CardTitle>
      </CardHeader>
      <CardContent>
        <form action={handleLogin} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              required
              aria-label="Email address"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              name="password"
              type="password"
              required
              aria-label="Password"
            />
          </div>
          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}
          <Button type="submit" className="w-full transition-shadow hover:shadow-[0_0_16px_rgba(255,255,255,0.15)]" disabled={loading}>
            {loading ? 'Signing in...' : 'Sign In'}
          </Button>
        </form>
        <div className="mt-3">
          <button
            type="button"
            onClick={() => {
              setShowResetForm(true)
              setError(null)
            }}
            className="text-sm text-muted-foreground underline transition-all hover:drop-shadow-[0_0_6px_rgba(255,255,255,0.5)] hover:text-foreground"
          >
            Forgot password?
          </button>
        </div>
      </CardContent>
    </Card>
  )
}
