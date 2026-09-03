'use client'

import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from '@/lib/router'
import { Eye, EyeOff } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/Button'
import { AuthShell } from '@/components/layout/AuthShell'

export default function LoginPage() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const from = params.get('from') || '/'

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const submit = async (event: React.FormEvent) => {
    event.preventDefault()
    setError('')
    setLoading(true)
    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password })
    setLoading(false)
    if (signInError) {
      setError(signInError.message)
      return
    }
    navigate(from, { replace: true })
  }

  return (
    <AuthShell title="Welcome back" subtitle="Sign in to track orders and check out faster.">
      <form onSubmit={submit} className="flex flex-col gap-4">
        <Field label="Email">
          <input
            type="email"
            required
            value={email}
            onChange={e => setEmail(e.target.value)}
            className="input"
            autoComplete="email"
          />
        </Field>

        <Field label="Password">
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              required
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="input pr-11"
              autoComplete="current-password"
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
        </Field>

        {error && (
          <p className="rounded-lg bg-danger/10 px-3 py-2 text-body text-danger">{error}</p>
        )}

        <Button type="submit" size="lg" fullWidth loading={loading}>
          Login
        </Button>
      </form>

      <p className="mt-5 text-center text-body text-ink-muted">
        Don&apos;t have an account?{' '}
        <Link
          to={`/signup?from=${encodeURIComponent(from)}`}
          className="font-semibold text-brand"
        >
          Sign Up
        </Link>
      </p>
    </AuthShell>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-body font-semibold">{label}</span>
      {children}
    </label>
  )
}
