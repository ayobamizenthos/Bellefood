'use client'

import type { ReactNode } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Lock } from 'lucide-react'
import { useAuth } from '@/stores/auth'
import { buttonClassName } from '@/components/ui/Button'
import { PageSpinner } from '@/components/ui/BrandLoader'

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
          <Link
            href={`/login?from=${encodeURIComponent(pathname)}`}
            className={buttonClassName({ size: 'lg', fullWidth: true })}
          >
            Sign in
          </Link>
          <Link
            href="/shop"
            className="flex min-h-[44px] items-center text-body font-semibold text-brand"
          >
            Continue shopping
          </Link>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
