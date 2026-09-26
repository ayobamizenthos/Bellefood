'use client'

import { useState } from 'react'
import type { FormEvent } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { MailCheck } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { safeRedirectPath } from '@/lib/routes'
import { Button } from '@/components/ui/Button'
import { Field, FormError } from '@/components/ui/Field'
import { PasswordInput } from '@/components/ui/PasswordInput'
import { AuthShell } from '@/components/layout/AuthShell'

const USERNAME_PATTERN = /^[a-z0-9_]{3,20}$/
const MIN_PASSWORD_LENGTH = 8

export default function SignupScreen() {
  const router = useRouter()
  const params = useSearchParams()
  const from = safeRedirectPath(params.get('from'))
  const referral = (params.get('ref') ?? '').toLowerCase().trim()

  const [fullName, setFullName] = useState('')
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [awaitingConfirmation, setAwaitingConfirmation] = useState(false)

  const createAccount = async (event: FormEvent) => {
    event.preventDefault()
    setError('')
    if (!USERNAME_PATTERN.test(username)) {
      setError('Username must be 3-20 lowercase letters, numbers or underscore.')
      return
    }
    if (password.length < MIN_PASSWORD_LENGTH) {
      setError(`Password must be at least ${MIN_PASSWORD_LENGTH} characters.`)
      return
    }
    if (password !== confirm) {
      setError('Passwords do not match.')
      return
    }

    setLoading(true)
    const { data: available, error: availabilityError } = await supabase.rpc('username_available', {
      p_username: username,
    })
    if (availabilityError || !available) {
      setLoading(false)
      setError(availabilityError ? 'Could not check that username. Please try again.' : 'That username is taken.')
      return
    }

    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName, phone, username, referral } },
    })
    setLoading(false)
    if (signUpError) {
      setError(signUpError.message)
      return
    }
    if (!data.session) {
      setAwaitingConfirmation(true)
      return
    }
    router.replace(from)
  }

  if (awaitingConfirmation) {
    return (
      <AuthShell title="Check your email" subtitle="One more step to finish signing up.">
        <div className="flex flex-col items-center gap-4 text-center">
          <span className="grid h-14 w-14 place-items-center rounded-full bg-success/10 text-success">
            <MailCheck size={28} />
          </span>
          <p className="text-body text-ink-muted">
            We sent a confirmation link to <span className="font-semibold text-ink">{email}</span>.
            Open it to activate your account, then sign in.
          </p>
          <Link href={`/login?from=${encodeURIComponent(from)}`} className="font-semibold text-brand">
            Go to sign in
          </Link>
        </div>
      </AuthShell>
    )
  }

  return (
    <AuthShell
      title="Create your account"
      subtitle="Join Belle Food for faster checkout and live order tracking."
    >
      <form onSubmit={createAccount} className="flex flex-col gap-4">
        <Field label="Full Name">
          <input
            required
            value={fullName}
            onChange={event => setFullName(event.target.value)}
            autoComplete="name"
            className="input"
          />
        </Field>

        <Field label="Username" hint="Your permanent referral handle. Share it to earn rewards.">
          <input
            required
            value={username}
            onChange={event => setUsername(event.target.value.toLowerCase())}
            placeholder="yourname"
            maxLength={20}
            autoComplete="username"
            className="input"
          />
        </Field>

        {referral && (
          <p className="rounded-lg bg-brand-tint px-3 py-2 text-label text-brand">
            Invited by <span className="font-semibold">@{referral}</span>. You both earn points on
            your first order.
          </p>
        )}

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

        <Field label="Phone">
          <input
            type="tel"
            value={phone}
            onChange={event => setPhone(event.target.value)}
            className="input"
            autoComplete="tel"
          />
        </Field>

        <Field label="Password">
          <PasswordInput
            value={password}
            onChange={setPassword}
            visible={showPassword}
            onToggleVisible={() => setShowPassword(visible => !visible)}
            autoComplete="new-password"
          />
        </Field>

        <Field label="Confirm Password">
          <PasswordInput
            value={confirm}
            onChange={setConfirm}
            visible={showPassword}
            autoComplete="new-password"
          />
        </Field>

        <FormError message={error} />

        <Button type="submit" size="lg" fullWidth loading={loading}>
          Create Account
        </Button>
      </form>

      <p className="mt-5 text-center text-body text-ink-muted">
        Already have an account?{' '}
        <Link href={`/login?from=${encodeURIComponent(from)}`} className="font-semibold text-brand">
          Sign in
        </Link>
      </p>
    </AuthShell>
  )
}
