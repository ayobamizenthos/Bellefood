'use client'

import { useState } from 'react'
import type { FormEvent } from 'react'
import Link from 'next/link'
import { MailCheck } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { SITE } from '@/lib/site'
import { Button } from '@/components/ui/Button'
import { Field, FormError } from '@/components/ui/Field'
import { AuthShell } from '@/components/layout/AuthShell'

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  const requestResetLink = async (event: FormEvent) => {
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
          <Link href="/login" className="font-semibold text-brand">
            Back to sign in
          </Link>
        </div>
      </AuthShell>
    )
  }

  return (
    <AuthShell title="Reset your password" subtitle="Enter your email and we'll send a reset link.">
      <form onSubmit={requestResetLink} className="flex flex-col gap-4">
        <Field label="Email">
          <input
            type="email"
            required
            value={email}
            onChange={event => setEmail(event.target.value)}
            className="input"
            autoComplete="email"
          />
        </Field>

        <FormError message={error} />

        <Button type="submit" size="lg" fullWidth loading={loading}>
          Send reset link
        </Button>
      </form>

      <p className="mt-5 text-center text-body text-ink-muted">
        Remembered it?{' '}
        <Link href="/login" className="font-semibold text-brand">
          Back to sign in
        </Link>
      </p>
    </AuthShell>
  )
}
