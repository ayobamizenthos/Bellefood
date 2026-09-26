'use client'

import { useState } from 'react'
import type { FormEvent } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { safeRedirectPath } from '@/lib/routes'
import { Button } from '@/components/ui/Button'
import { Field, FormError } from '@/components/ui/Field'
import { PasswordInput } from '@/components/ui/PasswordInput'
import { AuthShell } from '@/components/layout/AuthShell'

export default function LoginScreen() {
  const router = useRouter()
  const params = useSearchParams()
  const from = safeRedirectPath(params.get('from'))

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const signIn = async (event: FormEvent) => {
    event.preventDefault()
    setError('')
    setLoading(true)
    const { data, error: signInError } = await supabase.auth.signInWithPassword({ email, password })
    if (signInError) {
      setLoading(false)
      setError(signInError.message)
      return
    }

    let destination = from
    if (from === '/') {
      const { data: profile } = await supabase
        .from('profiles')
        .select('is_admin')
        .eq('id', data.user.id)
        .maybeSingle()
      if (profile?.is_admin) destination = '/admin'
    }
    setLoading(false)
    router.replace(destination)
  }

  return (
    <AuthShell title="Welcome back" subtitle="Sign in to track orders and check out faster.">
      <form onSubmit={signIn} className="flex flex-col gap-4">
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

        <Field label="Password">
          <PasswordInput
            value={password}
            onChange={setPassword}
            visible={showPassword}
            onToggleVisible={() => setShowPassword(visible => !visible)}
            autoComplete="current-password"
          />
        </Field>

        <Link
          href="/forgot-password"
          className="-mt-1 flex min-h-[44px] items-center self-end text-body font-semibold text-brand"
        >
          Forgot password?
        </Link>

        <FormError message={error} />

        <Button type="submit" size="lg" fullWidth loading={loading}>
          Sign in
        </Button>
      </form>

      <p className="mt-5 text-center text-body text-ink-muted">
        Don&apos;t have an account?{' '}
        <Link href={`/signup?from=${encodeURIComponent(from)}`} className="font-semibold text-brand">
          Sign up
        </Link>
      </p>
    </AuthShell>
  )
}
