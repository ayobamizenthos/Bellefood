'use client'

import { useState } from 'react'
import type { FormEvent } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { usePasswordRecovery } from '@/hooks/usePasswordRecovery'
import { Button } from '@/components/ui/Button'
import { Field, FormError } from '@/components/ui/Field'
import { PasswordInput } from '@/components/ui/PasswordInput'
import { AuthShell } from '@/components/layout/AuthShell'

const MIN_PASSWORD_LENGTH = 8
const REDIRECT_DELAY_MS = 1600

export default function ResetPasswordScreen() {
  const router = useRouter()
  const ready = usePasswordRecovery()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)

  const updatePassword = async (event: FormEvent) => {
    event.preventDefault()
    setError('')
    if (password.length < MIN_PASSWORD_LENGTH) {
      setError(`Password must be at least ${MIN_PASSWORD_LENGTH} characters.`)
      return
    }
    if (password !== confirm) {
      setError('Passwords do not match.')
      return
    }
    setLoading(true)
    const { error: updateError } = await supabase.auth.updateUser({ password })
    setLoading(false)
    if (updateError) {
      setError(updateError.message)
      return
    }
    setDone(true)
    setTimeout(() => router.replace('/'), REDIRECT_DELAY_MS)
  }

  if (done) {
    return (
      <AuthShell title="Password updated" subtitle="You can now use your new password.">
        <p className="text-center text-body text-ink-muted">Taking you to Belle Food…</p>
      </AuthShell>
    )
  }

  return (
    <AuthShell
      title="Set a new password"
      subtitle={ready ? 'Choose a new password for your account.' : 'Open this page from your reset link.'}
    >
      {ready ? (
        <form onSubmit={updatePassword} className="flex flex-col gap-4">
          <Field label="New password">
            <PasswordInput
              value={password}
              onChange={setPassword}
              visible={showPassword}
              onToggleVisible={() => setShowPassword(visible => !visible)}
              autoComplete="new-password"
            />
          </Field>
          <Field label="Confirm password">
            <PasswordInput
              value={confirm}
              onChange={setConfirm}
              visible={showPassword}
              autoComplete="new-password"
            />
          </Field>

          <FormError message={error} />

          <Button type="submit" size="lg" fullWidth loading={loading}>
            Update password
          </Button>
        </form>
      ) : (
        <p className="text-body text-ink-muted">
          This page works only when opened from the reset link we email you. Request one from the{' '}
          <Link href="/forgot-password" className="font-semibold text-brand">
            forgot password
          </Link>{' '}
          page.
        </p>
      )}
    </AuthShell>
  )
}
