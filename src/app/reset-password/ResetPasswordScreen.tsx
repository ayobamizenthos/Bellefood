'use client'

import { useEffect, useState } from 'react'
import { Link, useNavigate } from '@/lib/router'
import { Eye, EyeOff } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/Button'
import { AuthShell } from '@/components/layout/AuthShell'

export default function ResetPasswordScreen() {
  const navigate = useNavigate()
  const [ready, setReady] = useState(false)
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) setReady(true)
    })
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) setReady(true)
    })
    return () => subscription.unsubscribe()
  }, [])

  const submit = async (event: React.FormEvent) => {
    event.preventDefault()
    setError('')
    if (password.length < 8) {
      setError('Password must be at least 8 characters.')
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
    setTimeout(() => navigate('/', { replace: true }), 1600)
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
        <form onSubmit={submit} className="flex flex-col gap-4">
          <label className="flex flex-col gap-1.5">
            <span className="text-body font-semibold">New password</span>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="input pr-11"
                autoComplete="new-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-muted"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-body font-semibold">Confirm password</span>
            <input
              type={showPassword ? 'text' : 'password'}
              required
              value={confirm}
              onChange={e => setConfirm(e.target.value)}
              className="input"
              autoComplete="new-password"
            />
          </label>

          {error && (
            <p className="rounded-lg bg-danger/10 px-3 py-2 text-body text-danger">{error}</p>
          )}

          <Button type="submit" size="lg" fullWidth loading={loading}>
            Update password
          </Button>
        </form>
      ) : (
        <p className="text-body text-ink-muted">
          This page works only when opened from the reset link we email you. Request one from the{' '}
          <Link to="/forgot-password" className="font-semibold text-brand">
            forgot password
          </Link>{' '}
          page.
        </p>
      )}
    </AuthShell>
  )
}
