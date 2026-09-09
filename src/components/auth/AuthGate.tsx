'use client'

import type { ReactNode } from 'react'
import { usePathname } from 'next/navigation'
import { Lock } from 'lucide-react'
import { useAuth } from '@/stores/auth'
import { useNavigate } from '@/lib/router'
import { Button } from '@/components/ui/Button'
import { PageSpinner } from '@/components/ui/PageSpinner'

export function AuthGate({
  title,
  message,
  children,
}: {
  title: string
  message: string
  children: ReactNode
}) {
  const { session, loading } = useAuth()
  const navigate = useNavigate()
  const pathname = usePathname()

  if (loading) return <PageSpinner />

  if (!session) {
    return (
      <div className="flex flex-col items-center gap-4 py-16 text-center">
        <span className="grid h-16 w-16 place-items-center rounded-full bg-brand-tint text-brand">
          <Lock size={28} />
        </span>
        <h1 className="text-xl font-bold">{title}</h1>
        <p className="max-w-sm text-body text-ink-muted">{message}</p>
        <div className="mt-2 flex w-full max-w-xs flex-col items-center gap-3">
          <Button
            size="lg"
            fullWidth
            onClick={() => navigate(`/login?from=${encodeURIComponent(pathname)}`)}
          >
            Sign In
          </Button>
          <button
            type="button"
            onClick={() => navigate('/shop')}
            className="text-body font-semibold text-brand"
          >
            Continue shopping
          </button>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
