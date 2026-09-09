'use client'

import { useState } from 'react'
import { Link } from '@/lib/router'
import { MailCheck } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { SITE } from '@/lib/site'
import { Button } from '@/components/ui/Button'
import { AuthShell } from '@/components/layout/AuthShell'

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  const submit = async (event: React.FormEvent) => {
    event.preventDefault()
    setError('')
    setLoading(true)
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${SITE.url}/reset-password`,
    })
    setLoading(false)
    if (resetError) {
      setError(resetError.message)
      return
    }
    setSent(true)
  }

  if (sent) {
    return (
      <AuthShell title="Check your email" subtitle="A password reset link is on its way.">
        <div className="flex flex-col items-center gap-4 text-center">
          <span className="grid h-14 w-14 place-items-center rounded-full bg-success/10 text-success">
            <MailCheck size={28} />
          </span>
          <p className="text-body text-ink-muted">
            If an account exists for <span className="font-semibold text-ink">{email}</span>, we sent
            a link to reset your password. Open it to set a new one.
          </p>
          <Link to="/login" className="font-semibold text-brand">
            Back to login
          </Link>
        </div>
      </AuthShell>
    )
  }

  return (
    <AuthShell title="Reset your password" subtitle="Enter your email and we'll send a reset link.">
      <form onSubmit={submit} className="flex flex-col gap-4">
        <label className="flex flex-col gap-1.5">
          <span className="text-body font-semibold">Email</span>
          <input
            type="email"
            required
            value={email}
            onChange={e => setEmail(e.target.value)}
            className="input"
            autoComplete="email"
          />
        </label>

        {error && (
          <p className="rounded-lg bg-danger/10 px-3 py-2 text-body text-danger">{error}</p>
        )}

        <Button type="submit" size="lg" fullWidth loading={loading}>
          Send reset link
        </Button>
      </form>

      <p className="mt-5 text-center text-body text-ink-muted">
        Remembered it?{' '}
        <Link to="/login" className="font-semibold text-brand">
          Back to login
        </Link>
      </p>
    </AuthShell>
  )
}
