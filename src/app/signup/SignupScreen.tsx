'use client'

import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from '@/lib/router'
import { Eye, EyeOff } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/Button'
import { AuthShell } from '@/components/layout/AuthShell'

export default function SignupPage() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const from = params.get('from') || '/'

  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const submit = async (event: React.FormEvent) => {
    event.preventDefault()
    setError('')
    if (password !== confirm) {
      setError('Passwords do not match.')
      return
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters.')
      return
    }
    setLoading(true)
    const { error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName, phone } },
    })
    setLoading(false)
    if (signUpError) {
      setError(signUpError.message)
      return
    }
    navigate(from, { replace: true })
  }

  return (
    <AuthShell
      title="Create your account"
      subtitle="Join Belle Food for faster checkout and live order tracking."
    >
      <form onSubmit={submit} className="flex flex-col gap-4">
        <label className="flex flex-col gap-1.5">
          <span className="input-label">Full Name</span>
          <input
            required
            value={fullName}
            onChange={e => setFullName(e.target.value)}
            className="input"
          />
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="input-label">Email</span>
          <input
            type="email"
            required
            value={email}
            onChange={e => setEmail(e.target.value)}
            className="input"
            autoComplete="email"
          />
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="input-label">Phone</span>
          <input
            type="tel"
            value={phone}
            onChange={e => setPhone(e.target.value)}
            className="input"
            autoComplete="tel"
          />
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="input-label">Password</span>
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
          <span className="input-label">Confirm Password</span>
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
          Create Account
        </Button>
      </form>

      <p className="mt-5 text-center text-body text-ink-muted">
        Already have an account?{' '}
        <Link
          to={`/login?from=${encodeURIComponent(from)}`}
          className="font-semibold text-brand"
        >
          Login
        </Link>
      </p>
    </AuthShell>
  )
}
